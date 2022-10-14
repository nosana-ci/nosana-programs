use crate::{JobState, JobType, QueueType};
use anchor_lang::prelude::*;
use mpl_token_metadata::state::{Collection, Metadata, TokenMetadataAccount};
use nosana_common::writer::BpfWriter;
use nosana_common::{cpi, id};
use std::mem::size_of;

/***
 * Accounts
 */

/// The `MarketAccount` struct holds all the information about jobs and the nodes queue.
#[account]
pub struct MarketAccount {
    pub authority: Pubkey,
    pub job_expiration: i64,
    pub job_price: u64,
    pub job_timeout: i64,
    pub job_type: u8,
    pub vault: Pubkey,
    pub vault_bump: u8,
    pub node_access_key: Pubkey,
    pub node_xnos_minimum: u128,
    pub queue_type: u8,
    pub queue: Vec<Pubkey>,
}

impl MarketAccount {
    pub const SIZE: usize = 8 + size_of::<MarketAccount>() + size_of::<[Pubkey; 100]>();
    pub const JOB_FEE_FRACTION: u64 = 10;
    pub const EXPIRATION: u64 = 10;

    #[allow(clippy::too_many_arguments)]
    pub fn init(
        &mut self,
        authority: Pubkey,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_access_key: Pubkey,
        node_xnos_minimum: u128,
        vault: Pubkey,
        vault_bump: u8,
    ) -> Result<()> {
        self.authority = authority;
        self.job_expiration = job_expiration;
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.node_access_key = node_access_key;
        self.node_xnos_minimum = node_xnos_minimum;
        self.vault = vault;
        self.vault_bump = vault_bump;
        self.queue = Vec::new();
        self.queue_type = QueueType::Empty as u8;
        Ok(())
    }

    pub fn update(
        &mut self,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_access_key: Pubkey,
        node_stake_minimum: u128,
    ) -> Result<()> {
        self.job_expiration = job_expiration;
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.node_access_key = node_access_key;
        self.node_xnos_minimum = node_stake_minimum;
        Ok(())
    }

    pub fn job_fee(&self) -> u64 {
        self.job_price / MarketAccount::JOB_FEE_FRACTION
    }

    pub fn add_to_queue(&mut self, order: Pubkey, is_job: bool) -> Result<()> {
        if self.job_type == JobType::Unknown as u8 {
            return Ok(());
        }
        if self.queue_type == QueueType::Empty as u8 {
            self.set_queue_type(if is_job {
                QueueType::Job
            } else {
                QueueType::Node
            })
        }
        self.queue.push(order);
        Ok(())
    }

    pub fn remove_from_queue(&mut self, node: &Pubkey) -> Result<()> {
        let index: usize = self.find_in_queue(node).unwrap();
        self.queue.remove(index);
        Ok(())
    }

    pub fn pop_from_queue(&mut self) -> Pubkey {
        // we check if there is one left
        if self.queue.len() == 1 {
            self.set_queue_type(QueueType::Empty);
        }
        self.queue.pop().unwrap()
    }

    pub fn find_in_queue(&mut self, pubkey: &Pubkey) -> Option<usize> {
        MarketAccount::find_in_queue_static(&self.queue, pubkey)
    }

    pub fn set_queue_type(&mut self, queue_type: QueueType) {
        self.queue_type = queue_type as u8;
    }

    /***
      This constraint verifies that:
       - if a node's access key is non-default (SystemProgram)
            - the collection should have the verified = true trait
            - the collection address should match the node access key
       - else it's always OK to enter
    */
    pub fn metadata_constraint(metadata: &AccountInfo, node_access_key: Pubkey) -> bool {
        if node_access_key == id::SYSTEM_PROGRAM {
            true
        } else {
            let metadata: Metadata = Metadata::from_account_info(metadata).unwrap();
            let collection: Collection = metadata.collection.unwrap();
            collection.verified && collection.key == node_access_key
        }
    }

    pub fn find_in_queue_static(queue: &[Pubkey], pubkey: &Pubkey) -> Option<usize> {
        queue.iter().position(|order: &Pubkey| order == pubkey)
    }

    /***
     This constraint verifies that nodes can only enter the queue once
    */
    pub fn node_constraint(node: &Pubkey, queue: &[Pubkey], queue_type: u8) -> bool {
        if queue_type != QueueType::Job as u8 {
            MarketAccount::find_in_queue_static(queue, node).is_none()
        } else {
            true
        }
    }
}

/// The `JobAccount` struct holds all the information about any individual jobs.
#[account]
pub struct JobAccount {
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub market: Pubkey,
    pub node: Pubkey,
    pub payer: Pubkey,
    pub price: u64,
    pub project: Pubkey,
    pub state: u8,
    pub time_end: i64,
    pub time_start: i64,
}

impl JobAccount {
    pub const SIZE: usize = 8 + size_of::<JobAccount>();

    pub fn create(
        &mut self,
        ipfs_job: [u8; 32],
        market: Pubkey,
        payer: Pubkey,
        price: u64,
        project: Pubkey,
    ) {
        self.ipfs_job = ipfs_job;
        self.market = market;
        self.payer = payer;
        self.price = price;
        self.project = project;
        self.state = JobState::Queued as u8;
    }

    pub fn claim(&mut self, node: Pubkey, time_start: i64) {
        self.node = node;
        self.state = JobState::Running as u8;
        self.time_start = time_start;
    }

    pub fn quit(&mut self) -> Result<()> {
        self.state = JobState::Stopped as u8;
        Ok(())
    }

    pub fn finish(&mut self, ipfs_result: [u8; 32], node: Pubkey, time_end: i64) {
        self.ipfs_result = ipfs_result;
        self.node = node;
        self.state = JobState::Done as u8;
        self.time_end = time_end;
    }
}

/// The `RunAccount` struct holds temporary information that matches nodes to jobs.
#[account]
pub struct RunAccount {
    pub job: Pubkey,
    pub node: Pubkey,
    pub payer: Pubkey,
    pub state: u8,
    pub time: i64,
}

impl RunAccount {
    pub const SIZE: usize = 8 + size_of::<RunAccount>();

    fn from_account_info<'info>(info: &AccountInfo<'info>) -> Account<'info, Self> {
        Account::try_from_unchecked(info).unwrap()
    }

    fn serialize(&self, info: AccountInfo) -> Result<()> {
        let dst: &mut [u8] = &mut info.try_borrow_mut_data().unwrap();
        let mut writer: BpfWriter<&mut [u8]> = BpfWriter::new(dst);
        RunAccount::try_serialize(self, &mut writer)
    }

    pub fn create(&mut self, job: Pubkey, node: Pubkey, payer: Pubkey, time: i64) -> Result<()> {
        self.job = job;
        self.node = node;
        self.payer = payer;
        self.time = time;
        Ok(())
    }

    pub fn initialize<'info>(
        payer: AccountInfo<'info>,
        run_account: AccountInfo<'info>,
        system_program: AccountInfo<'info>,
        job: Pubkey,
        node: Pubkey,
    ) -> Result<()> {
        cpi::create_account(
            system_program,
            payer.to_account_info(),
            run_account.to_account_info(),
            RunAccount::SIZE,
            &id::JOBS_PROGRAM,
        )?;

        // deserialize and modify run account
        let mut run: Account<RunAccount> = RunAccount::from_account_info(&run_account);
        run.create(job, node, payer.key(), Clock::get()?.unix_timestamp)?;

        // write
        run.serialize(run_account)
    }
}

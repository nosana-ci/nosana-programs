use anchor_lang::prelude::*;
use mpl_token_metadata::state::{Collection, Metadata, TokenMetadataAccount};
use nosana_common::id;
use std::mem::size_of;

/***
 Accounts and Types
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
    pub node_xnos_minimum: u64,
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
        node_xnos_minimum: u64,
        vault: Pubkey,
        vault_bump: u8,
    ) {
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
    }

    pub fn update(
        &mut self,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_access_key: Pubkey,
        node_stake_minimum: u64,
    ) {
        self.job_expiration = job_expiration;
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.node_access_key = node_access_key;
        self.node_xnos_minimum = node_stake_minimum;
    }

    pub fn add_to_queue(&mut self, order: Pubkey, is_job: bool) {
        if self.job_type == JobType::Unknown as u8 {
            return;
        }
        if self.queue_type == QueueType::Empty as u8 {
            self.set_queue_type(if is_job {
                QueueType::Job
            } else {
                QueueType::Node
            })
        }
        self.queue.push(order);
    }

    pub fn remove_from_queue(&mut self, node: &Pubkey) -> Pubkey {
        let index: usize = self.find_in_queue(node).unwrap();
        self.queue.remove(index)
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

/// The `QueueType` describes the type of queue
#[repr(u8)]
pub enum QueueType {
    Job = 0,
    Node = 1,
    Empty = 255,
}

impl From<u8> for QueueType {
    fn from(queue_type: u8) -> Self {
        match queue_type {
            0 => QueueType::Job,
            1 => QueueType::Node,
            _ => QueueType::Empty,
        }
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

    pub fn create(&mut self, job: Pubkey, node: Pubkey, payer: Pubkey, time: i64) {
        self.job = job;
        self.node = node;
        self.payer = payer;
        self.state = RunState::Created as u8;
        self.time = time;
    }

    /***
      This constraint verifies that:
       - if there's an order queued (could be a node or job, queue_type matches the scenario);
           - a new run account will be initialized
           - the new run account should not have data in it (re-init attack)
       - if the queue is empty, OR the queue is of the wrong type:
           - a new public key will be put in the end of queue
           - no new run account will be initialized
           - the run dummy account is passed that's already created
    */
    pub fn constraint(run_state: u8, queue_type: u8, scenario: QueueType) -> bool {
        run_state
            == if queue_type == scenario as u8 {
                RunState::Null as u8
            } else {
                RunState::Created as u8
            }
    }
}

/// The `RunState` type describes the state a run account could have.
#[repr(u8)]
pub enum RunState {
    Null = 0,
    Created = 1,
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

    pub fn quit(&mut self) {
        self.state = JobState::Stopped as u8;
    }

    pub fn finish(&mut self, ipfs_result: [u8; 32], node: Pubkey, time_end: i64) {
        self.ipfs_result = ipfs_result;
        self.node = node;
        self.state = JobState::Done as u8;
        self.time_end = time_end;
    }
}

/// The `JobState` describes the status of a job.
#[repr(u8)]
pub enum JobState {
    Queued = 0,
    Running = 1,
    Done = 2,
    Stopped = 3,
}

/// The `JobType` describes the type of any job.
#[repr(u8)]
pub enum JobType {
    Default = 0,
    Small = 1,
    Medium = 2,
    Large = 3,
    Gpu = 4,
    Unknown = 255,
}

impl From<u8> for JobType {
    fn from(job_type: u8) -> Self {
        match job_type {
            0 => JobType::Default,
            1 => JobType::Small,
            2 => JobType::Medium,
            3 => JobType::Large,
            4 => JobType::Gpu,
            _ => JobType::Unknown,
        }
    }
}

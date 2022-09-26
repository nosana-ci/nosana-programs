use anchor_lang::prelude::*;
use nosana_common::id;
use std::mem::size_of;

/// # Market Account

#[account]
pub struct MarketAccount {
    pub authority: Pubkey,
    pub job_price: u64,
    pub job_timeout: i64,
    pub job_type: u8,
    pub vault: Pubkey,
    pub vault_bump: u8,
    pub node_access_key: Pubkey,
    pub node_stake_minimum: u64,
    pub node_queue: Vec<Pubkey>,
}

impl MarketAccount {
    pub const SIZE: usize = 8 + size_of::<MarketAccount>() + size_of::<Pubkey>() * 100;
    pub const JOB_FEE_FRACTION: u64 = 10;

    #[allow(clippy::too_many_arguments)]
    pub fn init(
        &mut self,
        authority: Pubkey,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_access_key: Pubkey,
        node_stake_minimum: u64,
        vault: Pubkey,
        vault_bump: u8,
    ) {
        self.authority = authority;
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.node_access_key = node_access_key;
        self.node_queue = Vec::new();
        self.node_stake_minimum = node_stake_minimum;
        self.vault = vault;
        self.vault_bump = vault_bump;
    }

    pub fn update(
        &mut self,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_access_key: Pubkey,
        node_stake_minimum: u64,
    ) {
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.node_access_key = node_access_key;
        self.node_stake_minimum = node_stake_minimum;
    }

    pub fn enter(&mut self, node: Pubkey) {
        self.node_queue.push(node)
    }

    pub fn get(&mut self) -> Pubkey {
        if self.node_queue.is_empty() {
            id::SYSTEM_PROGRAM
        } else {
            self.node_queue.pop().unwrap()
        }
    }

    pub fn find(&mut self, node: &Pubkey) -> Option<usize> {
        self.node_queue
            .iter()
            .position(|pubkey: &Pubkey| pubkey == node)
    }

    pub fn exit(&mut self, node: &Pubkey) {
        let index: Option<usize> = self.find(node);
        self.node_queue.remove(index.unwrap());
    }
}

/// # Job Account

#[account]
pub struct JobAccount {
    pub authority: Pubkey,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub market: Pubkey,
    pub node: Pubkey,
    pub price: u64,
    pub status: u8,
    pub time_end: i64,
    pub time_start: i64,
}

impl JobAccount {
    pub const SIZE: usize = 8 + size_of::<JobAccount>();

    pub fn create(&mut self, authority: Pubkey, ipfs_job: [u8; 32], market: Pubkey, price: u64) {
        self.authority = authority;
        self.ipfs_job = ipfs_job;
        self.market = market;
        self.price = price;
        self.status = JobStatus::Queued as u8;
    }

    pub fn claim(&mut self, node: Pubkey, time_start: i64) {
        self.node = node;
        self.status = JobStatus::Running as u8;
        self.time_start = time_start;
    }

    pub fn cancel(&mut self) {
        self.node = id::SYSTEM_PROGRAM;
        self.status = JobStatus::Queued as u8;
        self.time_start = 0;
    }

    pub fn finish(&mut self, ipfs_result: [u8; 32], time_end: i64) {
        self.ipfs_result = ipfs_result;
        self.status = JobStatus::Done as u8;
        self.time_end = time_end;
    }
}

/// # Job Status

#[repr(u8)]
pub enum JobStatus {
    Queued = 0,
    Running = 1,
    Done = 2,
}

/// # Job Type

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

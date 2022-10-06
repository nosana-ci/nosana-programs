use anchor_lang::prelude::*;
use nosana_common::id;
use std::mem::size_of;

/// ### Market Account
///
/// The `MarketAccount` struct holds all the information about jobs and the nodes queue.
///
#[account]
pub struct MarketAccount {
    pub authority: Pubkey,
    pub has_job: bool,
    pub has_node: bool,
    pub job_price: u64,
    pub job_timeout: i64,
    pub job_type: u8,
    pub vault: Pubkey,
    pub vault_bump: u8,
    pub node_access_key: Pubkey,
    pub node_stake_minimum: u64,
    pub queue_type: u8,
    pub queue: Vec<Order>,
}

impl MarketAccount {
    pub const SIZE: usize = 8 + size_of::<MarketAccount>() + size_of::<[Order; 100]>();
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
        self.has_job = false;
        self.has_node = false;
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.node_access_key = node_access_key;
        self.node_stake_minimum = node_stake_minimum;
        self.vault = vault;
        self.vault_bump = vault_bump;
        self.queue = Vec::new();
        self.queue_type = QueueType::Unknown as u8;
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

    pub fn add_to_queue(&mut self, order: Order) {
        if self.queue_type == QueueType::Unknown as u8 {
            self.set_queue_type(if order.node == id::SYSTEM_PROGRAM {
                QueueType::Job
            } else {
                QueueType::Node
            })
        }
        self.queue.push(order);
    }

    pub fn has_node(market: MarketAccount) -> bool {
        market.queue_type == QueueType::Node as u8
    }

    pub fn has_job(market: MarketAccount) -> bool {
        market.queue_type == QueueType::Job as u8
    }

    pub fn remove_node_from_queue(&mut self, node: Pubkey) -> Order {
        let index: usize = self.find_node_in_queue(node).unwrap();
        self.queue.remove(index)
    }

    pub fn pop_from_queue(&mut self) -> Order {
        // we check if there is one left
        if self.queue.len() == 1 {
            self.set_queue_type(QueueType::Unknown);
        }
        self.queue.pop().unwrap()
    }

    pub fn find_node_in_queue(&mut self, node: Pubkey) -> Option<usize> {
        self.queue
            .iter()
            .position(|job_node: &Order| job_node.node == node)
    }

    pub fn set_queue_type(&mut self, queue_type: QueueType) {
        self.queue_type = queue_type as u8;
        self.has_job = self.queue_type == QueueType::Job as u8;
        self.has_node = self.queue_type == QueueType::Node as u8;
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Order {
    pub authority: Pubkey,
    pub ipfs_job: [u8; 32],
    pub node: Pubkey,
}

impl Order {
    pub fn new_job(authority: Pubkey, ipfs_job: [u8; 32]) -> Order {
        Order {
            authority,
            ipfs_job,
            node: id::SYSTEM_PROGRAM,
        }
    }

    pub fn new_node(node: Pubkey) -> Order {
        Order {
            authority: id::SYSTEM_PROGRAM,
            ipfs_job: [0; 32],
            node,
        }
    }
}

/// ### Job Account
///
/// The `JobAccount` struct holds all the information about any individual jobs.
///
#[account]
pub struct JobAccount {
    pub authority: Pubkey,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub is_created: bool,
    pub market: Pubkey,
    pub node: Pubkey,
    pub price: u64,
    pub status: u8,
    pub time_end: i64,
    pub time_start: i64,
}

impl JobAccount {
    pub const SIZE: usize = 8 + size_of::<JobAccount>();

    pub fn create(
        &mut self,
        authority: Pubkey,
        ipfs_job: [u8; 32],
        market: Pubkey,
        node: Pubkey,
        price: u64,
        time_start: i64,
    ) {
        self.authority = authority;
        self.is_created = true;
        self.ipfs_job = ipfs_job;
        self.market = market;
        self.node = node;
        self.price = price;
        self.status = JobStatus::Running as u8;
        self.time_start = time_start;
    }

    pub fn claim(&mut self, node: Pubkey, time_start: i64) {
        self.node = node;
        self.status = JobStatus::Running as u8;
        self.time_start = time_start;
    }

    pub fn cancel(&mut self) {
        self.node = id::SYSTEM_PROGRAM;
        // self.node = Pubkey::default();
        self.status = JobStatus::Queued as u8;
        self.time_start = 0;
    }

    pub fn finish(&mut self, ipfs_result: [u8; 32], time_end: i64) {
        self.ipfs_result = ipfs_result;
        self.status = JobStatus::Done as u8;
        self.time_end = time_end;
    }
}

/// ### Queue Type
///
/// The `QueueType` describes the type of queue
///
#[repr(u8)]
pub enum QueueType {
    Job = 0,
    Node = 1,
    Unknown = 255,
}

impl From<u8> for QueueType {
    fn from(queue_type: u8) -> Self {
        match queue_type {
            0 => QueueType::Job,
            1 => QueueType::Node,
            _ => QueueType::Unknown,
        }
    }
}

/// ### Job Status
///
/// The `JobStatus` describes the status of any job
///
#[repr(u8)]
pub enum JobStatus {
    Queued = 0,
    Running = 1,
    Done = 2,
}

/// ### Job Type
///
/// The `JobType` describes the type of any job.
///
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

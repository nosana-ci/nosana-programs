use anchor_lang::prelude::*;
use nosana_common::{constants, id};
use std::mem::size_of;

/// # Constants

pub const NODE_STAKE_MINIMUM: u64 = 10_000 * constants::NOS_DECIMALS;

/// # NodesAccount

pub const QUEUE_LENGTH: usize = 1_000;
pub const NODES_SIZE: usize = 8 + size_of::<NodesAccount>() + size_of::<Pubkey>() * QUEUE_LENGTH;

#[account]
pub struct NodesAccount {
    pub job_price: u64,
    pub job_timeout: i64,
    pub job_type: u8,
    pub vault: Pubkey,
    pub nodes: Vec<Pubkey>,
}

impl NodesAccount {
    pub fn init(&mut self, job_price: u64, job_timeout: i64, job_type: u8, vault: Pubkey) {
        self.job_price = job_price;
        self.job_timeout = job_timeout;
        self.job_type = job_type;
        self.vault = vault;
        self.nodes = Vec::new();
    }

    pub fn enter(&mut self, node: Pubkey) {
        if self.find(&node).is_none() {
            self.nodes.push(node)
        };
    }

    pub fn get(&mut self) -> Pubkey {
        if self.nodes.is_empty() {
            id::SYSTEM_PROGRAM
        } else {
            self.nodes.pop().unwrap()
        }
    }

    pub fn find(&mut self, node: &Pubkey) -> Option<usize> {
        self.nodes.iter().position(|item: &Pubkey| item == node)
    }

    pub fn exit(&mut self, node: &Pubkey) {
        let index: Option<usize> = self.find(node);
        self.nodes.remove(index.unwrap());
    }
}

/// # JobAccount

pub const JOB_SIZE: usize = 8 + size_of::<JobAccount>();

#[account]
pub struct JobAccount {
    pub authority: Pubkey,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub node: Pubkey,
    pub status: u8,
    pub time_start: i64,
    pub time_end: i64,
    pub tokens: u64,
    pub vault: Pubkey,
}

impl JobAccount {
    pub fn create(&mut self, authority: Pubkey, ipfs_job: [u8; 32], tokens: u64, vault: Pubkey) {
        self.authority = authority;
        self.ipfs_job = ipfs_job;
        self.status = JobStatus::Queued as u8;
        self.tokens = tokens;
        self.vault = vault;
    }

    pub fn claim(&mut self, time: i64, node: Pubkey) {
        self.status = JobStatus::Running as u8;
        self.node = node;
        self.time_start = time;
    }

    pub fn cancel(&mut self) {
        self.status = JobStatus::Queued as u8;
        self.node = id::SYSTEM_PROGRAM;
        self.time_start = 0;
    }

    pub fn finish(&mut self, ipfs_result: [u8; 32], time_end: i64) {
        self.ipfs_result = ipfs_result;
        self.status = JobStatus::Done as u8;
        self.time_end = time_end;
    }
}

/// # JobStatus

#[repr(u8)]
pub enum JobStatus {
    Queued = 0,
    Running = 1,
    Done = 2,
}

/// # JobType

#[allow(dead_code)]
#[repr(u8)]
pub enum JobType {
    Default = 0,
    Small = 1,
    Medium = 2,
    Large = 3,
    Gpu = 4,
}

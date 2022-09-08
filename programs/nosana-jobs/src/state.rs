use anchor_lang::prelude::*;
use nosana_common::{constants, id};

/// # Constants

pub const NULL_IPFS: [u8; 32] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
pub const NODE_STAKE_MINIMUM: u64 = 10_000 * constants::NOS_DECIMALS;
pub const JOBS_SIZE: usize = 8 // 8 byte discriminator
    + std::mem::size_of::<JobsAccount>() // Main account with empty jobs vec
    + std::mem::size_of::<Job>() * 40; // actual jobs

/// # QueueAccount

#[account]
pub struct JobsAccount {
    pub vault: Pubkey,
    pub job_size: u8,
    pub job_status: u8,
    pub jobs: Vec<Job>,
}

impl JobsAccount {
    pub fn init(&mut self, job_size: u8, job_status: u8, vault: Pubkey) {
        self.job_size = job_size;
        self.job_status = job_status;
        self.vault = vault;
        self.jobs = Vec::new();
    }

    pub fn get_job(&mut self, requester_type: u8) -> Job {
        if !self.jobs.is_empty() {
            let job: &Job = self.jobs.first().unwrap();
            if requester_type == RequesterType::Project as u8 && job.has_node()
                || requester_type == RequesterType::Node as u8 && job.has_data()
            {
                return self.jobs.pop().unwrap();
            }
        }
        // when no job found, return empty job
        Job::default()
    }

    pub fn cancel_job(&mut self, authority: Pubkey) -> Job {
        self.jobs.remove(
            self.jobs
                .iter()
                .position(|job: &Job| job.authority == authority)
                .unwrap(),
        )
    }

    pub fn finish_job(&mut self, node: Pubkey) -> Job {
        self.jobs.remove(
            self.jobs
                .iter()
                .position(|job: &Job| job.node == node)
                .unwrap(),
        )
    }

    pub fn add_job(&mut self, job: Job) {
        self.jobs.push(job)
    }
}

/// # Job

#[account(BorschDeserialize, BorschSerialize)]
pub struct Job {
    pub authority: Pubkey,
    pub node: Pubkey,
    pub job_status: u8,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub time_start: i64,
    pub time_end: i64,
    pub tokens: u64,
}

impl Default for Job {
    fn default() -> Self {
        Self {
            authority: id::SYSTEM_PROGRAM,
            node: id::SYSTEM_PROGRAM,
            job_status: 0,
            ipfs_job: NULL_IPFS,
            ipfs_result: NULL_IPFS,
            time_start: 0,
            time_end: 0,
            tokens: 0,
        }
    }
}

impl Job {
    pub fn create(&mut self, authority: Pubkey, amount: u64, data: [u8; 32]) {
        self.authority = authority;
        self.job_status = JobStatus::Queued as u8;
        self.ipfs_job = data;
        self.tokens = amount;
    }

    pub fn claim(&mut self, time: i64, node: Pubkey) {
        self.job_status = JobStatus::Running as u8;
        self.node = node;
        self.time_start = time;
    }

    pub fn finish(&mut self, data: [u8; 32], time: i64) {
        self.ipfs_result = data;
        self.job_status = JobStatus::Done as u8;
        self.time_end = time;
    }

    pub fn has_node(&self) -> bool {
        self.node != id::SYSTEM_PROGRAM
    }

    pub fn has_data(&self) -> bool {
        self.ipfs_job != NULL_IPFS
    }

    pub fn copy(&mut self) -> Job {
        Job {
            authority: self.authority,
            node: self.node,
            job_status: self.job_status,
            ipfs_job: self.ipfs_job,
            ipfs_result: self.ipfs_result,
            time_start: self.time_start,
            time_end: self.time_end,
            tokens: self.tokens,
        }
    }
}

/// # JobStatus

#[repr(u8)]
pub enum JobStatus {
    Queued = 0,
    Running = 1,
    Done = 2,
}

/// # JobSize
//
// #[repr(u8)]
// pub enum JobSize {
//     Default = 0,
//     Small = 1,
//     Medium = 2,
//     Large = 3,
// }

/// # JobsType

#[repr(u8)]
pub enum RequesterType {
    Project = 0,
    Node = 1,
}

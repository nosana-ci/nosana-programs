use anchor_lang::prelude::*;
use nosana_common::NosanaError;

/// # Jobs
/// Account for holding jobs of a certain Project
/// - __authority__ is the payer and initial projects' creator
/// - __jobs__ is list of Jobs
#[account]
pub struct ProjectAccount {
    pub authority: Pubkey,
    pub jobs: Vec<Pubkey>,
}

// size of a jobs struct, in bytes
pub const JOBS_SIZE: usize = 8 + std::mem::size_of::<ProjectAccount>() + 32 * 100 + 16;

impl ProjectAccount {
    pub fn init(&mut self, authority: Pubkey) {
        self.authority = authority;
        self.jobs = Vec::new();
    }

    pub fn add_job(&mut self, job_key: Pubkey) {
        self.jobs.push(job_key);
    }

    pub fn remove_job(&mut self, job_key: &Pubkey) -> Result<()> {
        // find job in queue
        let index: Option<usize> = self.jobs.iter().position(|key: &Pubkey| key == job_key);

        // check if job is found
        require!(index.is_some(), NosanaError::JobQueueNotFound);

        // remove job from jobs list
        self.jobs.remove(index.unwrap());
        Ok(())
    }
}

/// # Job
/// Object that holds relevant information for a single Job
/// - __node__ is the ID of the node that claims the Job
/// - __job_status__ is the JobStatus the current Job
/// - __ipfs_result__ is the IPFS hash pointing to the job instructions
/// - __ipfs_result__ is the IPFS hash pointing to the job results
/// - __tokens__ is amount of tokens
#[account]
pub struct JobAccount {
    pub node: Pubkey,
    pub job_status: u8,
    pub time_start: i64,
    pub time_end: i64,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub tokens: u64,
}

// size of a job in bytes
pub const JOB_SIZE: usize = 8 + std::mem::size_of::<JobAccount>();

// timeout of a job in seconds
pub const TIMEOUT: i64 = 60 * 60;

impl JobAccount {
    pub fn create(&mut self, data: [u8; 32], amount: u64) {
        self.job_status = JobStatus::Initialized as u8;
        self.ipfs_job = data;
        self.tokens = amount;
    }

    pub fn claim(&mut self, node: Pubkey, time: i64) {
        self.job_status = JobStatus::Claimed as u8;
        self.node = node;
        self.time_start = time;
    }

    pub fn finish(&mut self, time: i64, data: [u8; 32]) {
        self.job_status = JobStatus::Finished as u8;
        self.ipfs_result = data;
        self.time_end = time;
    }

    pub fn cancel(&mut self) {
        self.job_status = JobStatus::Cancelled as u8;
    }
}

/// # JobStatus
/// Enumeration for the different states a Job can have
#[repr(u8)]
pub enum JobStatus {
    Initialized = 0,
    Claimed = 1,
    Finished = 2,
    Cancelled = 3,
}

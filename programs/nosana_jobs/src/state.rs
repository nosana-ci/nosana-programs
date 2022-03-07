use anchor_lang::prelude::*;

/// # Jobs
/// Account for holding jobs of a certain Project
/// - __authority__ is the payer and initial projects' creator
/// - __jobs__ is list of Jobs
pub const JOBS_SIZE: usize = 8 + std::mem::size_of::<Jobs>() + 32 * 100 + 16;
#[account]
pub struct Jobs {
    pub authority: Pubkey,
    pub jobs: Vec<Pubkey>,
}

/// # Job
/// Object that holds relevant information for a single Job
/// - __node__ is the ID of the node that claims the Job
/// - __job_status__ is the JobStatus the current Job
/// - __ipfs_result__ is the IPFS hash pointing to the job instructions
/// - __ipfs_result__ is the IPFS hash pointing to the job results
/// - __tokens__ is amount of tokens
pub const JOB_SIZE: usize = 8 + std::mem::size_of::<Job>();
#[account]
pub struct Job {
    pub node: Pubkey,
    pub job_status: u8,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub tokens: u64,
}

/// # JobStatus
/// Enumeration for the different states a Job can have
#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum JobStatus {
    Created = 0,
    Claimed = 1,
    Finished = 2,
    Cancelled = 3,
}

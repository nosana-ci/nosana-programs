use anchor_lang::prelude::*;
// use anchor_lang::solana_program::pubkey;


pub const QUEUE_MAX: usize = 100;

/// # Jobs
/// Account for holding jobs of a certain Project
/// - __authority__ is the payer and initial projects' creator
/// - __jobs__ is list of Jobs
pub const JOBS_SIZE: usize = 8 + std::mem::size_of::<Pubkey>() * QUEUE_MAX;
#[account]
pub struct Jobs {
    pub authority: Pubkey,
    pub jobs: Vec<Pubkey>,
}

/// # Job
/// Object that holds relevant information for a single Job
pub const JOB_SIZE: usize = 8 + std::mem::size_of::<Job>();
#[account]
pub struct Job {
    pub node: Pubkey,
    pub job_status: u8,
    pub ipfs_job: [u8; 32],
    pub ipfs_result: [u8; 32],
    pub tokens: u64,
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum JobStatus {
    Created = 0,
    Claimed = 1,
    Finished = 2,
}

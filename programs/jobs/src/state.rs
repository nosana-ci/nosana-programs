use anchor_lang::prelude::*;

#[cfg(feature = "prd")]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7";
}
#[cfg(not(feature = "prd"))]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp";
}

/// # Jobs
/// Account for holding jobs of a certain Project
/// - __authority__ is the payer and initial projects' creator
/// - __jobs__ is list of Jobs
#[account]
pub struct Jobs {
    pub project: Pubkey,
    pub jobs: Vec<Pubkey>,
}

/// # Job
/// Object that holds relevant information for a single Job
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

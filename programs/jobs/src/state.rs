use std::vec;
use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

#[cfg(feature = "prd")]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7";
}
#[cfg(not(feature = "prd"))]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp";
}


#[account]
pub struct Jobs {
    pub authority: Pubkey,
    pub jobs: Vec<u8>,
}

#[derive(Default, Clone, BorshSerialize, BorshDeserialize)]
pub struct Job {
    pub job_status: u8,
    pub ipfs_link: u8,
    pub tokens: u64,
}

impl Job {
    pub fn new(job_status: JobStatus, ipfs_link: u8, tokens: u64) -> Self {
        Self { job_status: job_status as u8, ipfs_link, tokens }
    }
}

#[repr(u8)]
pub enum JobStatus {
    Created,
    Claimed,
    // Errored,
    Finished,
}

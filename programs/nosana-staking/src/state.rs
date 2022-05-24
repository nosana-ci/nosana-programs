use crate::NosanaError;
use anchor_lang::prelude::*;

/// # Stake
#[account]
pub struct Stake {
    pub authority: Pubkey,
    pub time_start: i64,
    pub time_end: i64,
    pub amount: u64,
}

impl Stake {
    pub fn stake(&mut self, authority: Pubkey, amount: u64, time: i64) {
        self.authority = authority;
        self.amount += amount;
        self.time_start = time;
    }
    pub fn unstake(&mut self, authority: Pubkey, amount: u64, time: i64) {
        self.amount -= amount;
        self.time_start = time;
    }
}

/// # JobStatus
/// Enumeration for the different states a Job can have
#[repr(u8)]
pub enum StakeTier {
    Level0 = 0,
    Level1 = 1,
    Level2 = 2,
    Level3 = 3,
    Level4 = 4,
}

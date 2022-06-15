use anchor_lang::prelude::*;

pub const STAKE_SIZE: usize = 8 + std::mem::size_of::<StakeAccount>();
pub const DURATION_MIN: u128 = 365 * 24 * 60 * 60; // 1 year
pub const DURATION_MAX: u128 = 31 * 24 * 60 * 60; // 1 month

/// # Stake
#[account]
pub struct StakeAccount {
    pub authority: Pubkey,
    pub time_unstake: i64,
    pub duration: u128,
    pub amount: u64,
}

impl StakeAccount {
    pub fn stake(&mut self, authority: Pubkey, amount: u64, duration: u128) {
        self.authority = authority;
        self.amount = amount;
        self.duration = duration;
    }
    pub fn unstake(&mut self, time: i64) {
        self.time_unstake = time;
    }
    pub fn topup(&mut self, amount: u64) {
        self.amount += amount;
    }
}

pub const LEVEL0_MIN: u128 = u128::MIN;
pub const LEVEL0_MAX: u128 = LEVEL1_MIN - 1;

pub const LEVEL1_MIN: u128 = 1e2 as u128;
pub const LEVEL1_MAX: u128 = LEVEL2_MIN - 1;

pub const LEVEL2_MIN: u128 = 1e3 as u128;
pub const LEVEL2_MAX: u128 = LEVEL3_MIN - 1;

pub const LEVEL3_MIN: u128 = 1e4 as u128;
pub const LEVEL3_MAX: u128 = LEVEL4_MIN - 1;

pub const LEVEL4_MIN: u128 = 1e5 as u128;
pub const LEVEL4_MAX: u128 = u128::MAX;

/// # StakeTier
/// Enumeration for the different levels of stake
#[repr(u8)]
pub enum StakeTier {
    Level0 = 0,
    Level1 = 1,
    Level2 = 2,
    Level3 = 3,
    Level4 = 4,
}

#[event]
pub struct Rank {
    pub xnos: u128,
    pub tier: u8,
}

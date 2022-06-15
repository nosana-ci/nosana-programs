use anchor_lang::prelude::*;

pub const STAKE_SIZE: usize = 8 + std::mem::size_of::<StakeAccount>();
pub const NOS_DECIMALS: u128 = 1_000_000;
pub const SECONDS_PER_DAY: u128 = 24 * 60 * 60;
pub const DURATION_MIN: u128 = 90 * SECONDS_PER_DAY; // ~3 months
pub const DURATION_MAX: u128 = 4 * DURATION_MIN; // ~1 year
pub const TIME_DIV: u128 = SECONDS_PER_DAY;

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
        self.time_unstake = 0;
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

pub const LEVEL1_MIN: u128 = 1_000 * NOS_DECIMALS * DURATION_MIN / TIME_DIV;
pub const LEVEL1_MAX: u128 = LEVEL2_MIN - 1;

pub const LEVEL2_MIN: u128 = 10_000 * NOS_DECIMALS * DURATION_MIN * 2 / TIME_DIV;
pub const LEVEL2_MAX: u128 = LEVEL3_MIN - 1;

pub const LEVEL3_MIN: u128 = 100_000 * NOS_DECIMALS * DURATION_MIN * 3 / TIME_DIV;
pub const LEVEL3_MAX: u128 = LEVEL4_MIN - 1;

pub const LEVEL4_MIN: u128 = 1_000_000 * NOS_DECIMALS * DURATION_MAX / TIME_DIV;
pub const LEVEL4_MAX: u128 = u128::MAX;

/// # StakeTier
/// Enumeration for the different levels of stake
#[repr(u8)]
pub enum StakeTier {
    Level0 = 0,
    Level1 = 1, // Beaver
    Level2 = 2, // Bull
    Level3 = 3, // Shark
    Level4 = 4, // Whale
}

#[event]
pub struct Rank {
    pub xnos: u128,
    pub tier: u8,
}

use anchor_lang::prelude::*;

pub mod duration {
    pub const SECONDS_PER_MONTH: u128 = 365 * 24 * 60 * 60 / 12;
    pub const DURATION_MONTH: u128 = SECONDS_PER_MONTH;
    pub const DURATION_YEAR: u128 = 12 * SECONDS_PER_MONTH;
}

/// # Vault

pub const STATS_SIZE: usize = 8 + std::mem::size_of::<StatsAccount>();

#[account]
pub struct StatsAccount {
    pub xnos: u128,
    pub bump: u8,
}

impl StatsAccount {
    pub fn init(&mut self, bump: u8) {
        self.xnos = 0;
        self.bump = bump;
    }

    pub fn add(&mut self, amount: u128) {
        self.xnos += amount;
    }

    pub fn sub(&mut self, amount: u128) {
        self.xnos -= amount;
    }
}

/// # Stake

pub const STAKE_SIZE: usize = 8 + std::mem::size_of::<StakeAccount>();

#[account]
pub struct StakeAccount {
    pub authority: Pubkey,
    pub time_unstake: i64,
    pub duration: u128,
    pub amount: u64,
    pub bump: u8,
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
    pub fn extend(&mut self, duration: u128) {
        self.duration += duration;
    }
}

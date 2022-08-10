use anchor_lang::prelude::*;

/// # Constants

pub mod constants {
    use nosana_common::nos;

    pub const STAKE_MINIMUM: u64 = 1_000 * nos::DECIMALS;
    pub const SECONDS_PER_MONTH: u128 = 2_628_000; // 365 * 24 * 60 * 60 / 12
    pub const DURATION_MONTH: u128 = SECONDS_PER_MONTH;
    pub const DURATION_YEAR: u128 = 12 * SECONDS_PER_MONTH;
    pub const XNOS_PRECISION: u128 = u128::pow(10, 15); // 1e15
    pub const XNOS_DIV: u128 = 4 * SECONDS_PER_MONTH; // 0.25 growth per month
}

/// # Stats

pub const STATS_SIZE: usize = 8 + std::mem::size_of::<StatsAccount>();

#[account]
pub struct StatsAccount {
    pub authority: Pubkey,
}

impl StatsAccount {
    pub fn init(&mut self, authority: Pubkey) {
        self.authority = authority;
    }

    pub fn update_authority(&mut self, authority: Pubkey) {
        self.authority = authority;
    }
}

/// # Stake

pub const STAKE_SIZE: usize = 8 + std::mem::size_of::<StakeAccount>();

#[account]
pub struct StakeAccount {
    pub amount: u64,
    pub authority: Pubkey,
    pub duration: u64,
    pub time_unstake: i64,
    pub xnos: u128,
}

impl StakeAccount {
    pub fn init(&mut self, amount: u64, authority: Pubkey, duration: u64) {
        self.amount = amount;
        self.authority = authority;
        self.duration = duration;
        self.time_unstake = 0;
        self.update_xnos();
    }

    pub fn unstake(&mut self, time: i64) {
        self.time_unstake = time;
        self.update_xnos();
    }

    pub fn topup(&mut self, amount: u64) {
        self.amount += amount;
        self.update_xnos();
    }

    pub fn slash(&mut self, amount: u64) {
        self.amount -= amount;
        self.update_xnos();
    }

    pub fn extend(&mut self, duration: u64) {
        self.duration += duration;
        self.update_xnos();
    }

    fn update_xnos(&mut self) {
        self.xnos = if self.time_unstake != 0 {
            0
        } else {
            u128::from(self.duration)
                .checked_mul(constants::XNOS_PRECISION)
                .unwrap()
                .checked_div(constants::XNOS_DIV)
                .unwrap()
                .checked_add(constants::XNOS_PRECISION)
                .unwrap()
                .checked_mul(u128::from(self.amount))
                .unwrap()
                .checked_div(constants::XNOS_PRECISION)
                .unwrap()
        }
    }
}

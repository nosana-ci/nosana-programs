use anchor_lang::prelude::*;

/// # Constants

pub mod constants {
    use nosana_common::nos;

    pub const STAKE_MINIMUM: u64 = 1_000 * nos::DECIMALS;
    pub const SECONDS_PER_MONTH: u128 = 2_628_000; // 365 * 24 * 60 * 60 / 12
    pub const DURATION_MONTH: u128 = SECONDS_PER_MONTH;
    pub const DURATION_YEAR: u128 = 12 * SECONDS_PER_MONTH;
    pub const XNOS_PRECISION: u128 = nos::DECIMALS as u128;
    pub const XNOS_DIV: u128 = 10_512_000; // SECONDS_PER_MONTH x 4
}

/// # Stats

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
    pub amount: u64,
    pub authority: Pubkey,
    pub bump: u8,
    pub duration: u64,
    pub time_unstake: i64,
    pub xnos: u128,
}

impl StakeAccount {
    pub fn stake(&mut self, amount: u64, authority: Pubkey, bump: u8, duration: u64) {
        self.amount = amount;
        self.authority = authority;
        self.bump = bump;
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

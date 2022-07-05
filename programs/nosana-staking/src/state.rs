use anchor_lang::prelude::*;

pub mod duration {
    pub const SECONDS_PER_MONTH: u128 = 365 * 24 * 60 * 60 / 12;
    pub const DURATION_MONTH: u128 = SECONDS_PER_MONTH;
    pub const DURATION_YEAR: u128 = 12 * SECONDS_PER_MONTH;
}

/// # Vault

pub const VAULT_SIZE: usize = 8 + std::mem::size_of::<VaultAccount>();

#[account]
pub struct VaultAccount {
    pub xnos: u128,
}

impl VaultAccount {
    pub fn init(&mut self) {
        self.xnos = 0;
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

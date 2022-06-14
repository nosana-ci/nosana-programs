use anchor_lang::prelude::*;

pub const STAKE_SIZE: usize = 8 + std::mem::size_of::<StakeAccount>();

/// # Stake
#[account]
pub struct StakeAccount {
    pub authority: Pubkey,
    pub time: i64,
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
        self.time = time;
    }
    pub fn topup(&mut self, amount: u64) {
        self.amount += amount;
    }
}

/*
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
*/

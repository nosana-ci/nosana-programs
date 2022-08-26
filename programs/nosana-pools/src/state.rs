use anchor_lang::prelude::*;
use std::cmp;
// use nosana_common::constants;

/// # Pool

pub const POOL_SIZE: usize = 8 + std::mem::size_of::<PoolAccount>();

#[account]
pub struct PoolAccount {
    pub authority: Pubkey,
    pub claimed: u64,
    pub closeable: bool,
    pub emmission: u64,
    pub start_time: i64,
    pub vault: Pubkey,
    pub vault_bump: u8,
}

impl PoolAccount {
    pub fn init(
        &mut self,
        emmission: u64,
        authority: Pubkey,
        start_time: i64,
        vault: Pubkey,
        vault_bump: u8,
        closeable: bool,
    ) {
        self.emmission = emmission;
        self.authority = authority;
        self.claimed = 0;
        self.start_time = start_time;
        self.vault = vault;
        self.vault_bump = vault_bump;
        self.closeable = closeable;
    }

    pub fn claim(&mut self, amount_available: u64, now: i64) -> u64 {
        let pool_amount = (now - self.start_time) as u64 * self.emmission;
        let amount_due = pool_amount - self.claimed;
        let amount = cmp::min(amount_due, amount_available);

        self.claimed += amount;

        amount
    }
}

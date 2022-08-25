use anchor_lang::prelude::*;
use std::cmp;
// use nosana_common::constants;

/// # Pool

pub const POOL_SIZE: usize = 8 + std::mem::size_of::<PoolAccount>();

#[account]
pub struct PoolAccount {
    pub emmission: u64,
    pub authority: Pubkey,
    pub start_time: i64,
    pub vault: Pubkey,
    pub closeable: bool,
    pub last_claim_time: u64,
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
        self.start_time = start_time;
        self.last_claim_time = start_time as u64;
        self.vault = vault;
        self.vault_bump = vault_bump;
        self.closeable = closeable;
    }

    pub fn claim(&mut self, amount: u64, now: i64) -> u64 {
        let time_elapsed: u64 = now as u64 - self.last_claim_time;
        let time_available: u64 = amount / self.emmission;
        let time_paid: u64 = cmp::min(time_available, time_elapsed);
        let amount: u64 = time_paid * self.emmission;

        self.last_claim_time += time_paid;

        amount
    }
}

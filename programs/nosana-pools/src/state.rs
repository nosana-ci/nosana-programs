use anchor_lang::prelude::*;
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
    pub last_claim_time: i64,
}

impl PoolAccount {
    pub fn init(
        &mut self,
        emmission: u64,
        authority: Pubkey,
        start_time: i64,
        vault: Pubkey,
        closeable: bool,
    ) {
        self.emmission = emmission;
        self.authority = authority;
        self.start_time = start_time;
        self.last_claim_time = start_time;
        self.vault = vault;
        self.closeable = closeable;
    }

    pub fn unstake(&mut self, _time: i64) {
    }
}

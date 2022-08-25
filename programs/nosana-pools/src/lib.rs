mod instructions;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::*;
pub use state::*; // expose stake for cpi

declare_id!(id::POOLS_PROGRAM);

#[program]
pub mod nosana_pools {
    use super::*;

    pub fn open(ctx: Context<Open>, emmission: u64, start_time: i64, closeable: bool) -> Result<()> {
        open::handler(ctx, emmission, start_time, closeable)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }
}

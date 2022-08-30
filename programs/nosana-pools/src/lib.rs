mod instructions;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::*;
use state::*;

declare_id!(id::POOLS_PROGRAM);

#[program]
pub mod nosana_pools {
    use super::*;

    pub fn open(
        ctx: Context<Open>,
        emmission: u64,
        start_time: i64,
        claim_type: u8,
        closeable: bool,
    ) -> Result<()> {
        open::handler(ctx, emmission, start_time, claim_type, closeable)
    }

    pub fn claim_fee(ctx: Context<ClaimFee>) -> Result<()> {
        claim_fee::handler(ctx)
    }

    pub fn claim_transfer(ctx: Context<ClaimTransfer>) -> Result<()> {
        claim_transfer::handler(ctx)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }
}

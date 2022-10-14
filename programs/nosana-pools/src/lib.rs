mod errors;
mod instructions;
mod macros;
mod security;
mod state;
mod types;

use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use nosana_common::*;
use state::*;
use types::*;

declare_id!(id::POOLS_PROGRAM);

#[program]
pub mod nosana_pools {
    use super::*;

    /// The `open()` instruction lets you open a Nosana Pool's [PoolAccount](#pool-account)
    /// and [VaultAccount](#vault-account).
    pub fn open(
        ctx: Context<Open>,
        emission: u64,
        start_time: i64,
        claim_type: u8,
        closeable: bool,
    ) -> Result<()> {
        ctx.accounts.handler(
            emission,
            start_time,
            claim_type,
            closeable,
            *ctx.bumps.get("vault").unwrap(),
        )
    }

    /// The `claimFee()` instruction claims emissions from a Nosana Pool with claim type
    /// [`1`](#claim-type), and adds these as fees to the [Rewards Program](/programs/rewards).
    pub fn claim_fee(ctx: Context<ClaimFee>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// The `claimTransfer()` instruction claims emissions from a Nosana Pool
    /// with claim type [`0`](#claim-type), and transfer these to a given user.
    pub fn claim_transfer(ctx: Context<ClaimTransfer>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// The `close()` instruction closes a Nosana Pool's [PoolAccount](#pool-account)
    /// and [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }
}

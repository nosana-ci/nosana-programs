mod instructions;
mod security;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::*;
use state::*;

declare_id!(id::POOLS_PROGRAM);

#[program]
pub mod nosana_pools {
    use super::*;

    /// ### Open
    ///
    /// The `open()` instruction lets you open a Nosana Pool's [PoolAccount](#pool-account)
    /// and [VaultAccount](#vault-account).
    ///
    pub fn open(
        ctx: Context<Open>,
        emission: u64,
        start_time: i64,
        claim_type: u8,
        closeable: bool,
    ) -> Result<()> {
        open::handler(ctx, emission, start_time, claim_type, closeable)
    }

    /// ### Claim Fee
    ///
    /// The `claimFee()` instruction claims emissions from a Nosana Pool
    /// with claim type [`1`](#claim-type),
    /// and adds these as rewards (fees) to the [Rewards Program](/programs/rewards).
    ///
    pub fn claim_fee(ctx: Context<ClaimFee>) -> Result<()> {
        claim_fee::handler(ctx)
    }

    /// ### Claim Transfer
    ///
    /// The `claimTransfer()` instruction claims emissions from a Nosana Pool
    /// with claim type [`0`](#claim-type),
    /// and transfer these to a given user.
    ///
    pub fn claim_transfer(ctx: Context<ClaimTransfer>) -> Result<()> {
        claim_transfer::handler(ctx)
    }

    /// ### Close
    ///
    /// The `close()` instruction closes a Nosana Pool's [PoolAccount](#pool-account)
    ///  and [VaultAccount](#vault-account)..
    ///
    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }
}

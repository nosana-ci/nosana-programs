mod instructions;
mod security;
mod state;

use anchor_lang::declare_id;
use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::*;
pub use state::*; // expose state for cpi

declare_id!(id::REWARDS_PROGRAM);

#[program]
pub mod nosana_rewards {
    use super::*;

    /// The `init()` instruction initializes the [ReflectionAccount](#reflection-account)
    /// and [VaultAccount](#vault-account).
    pub fn init(ctx: Context<Init>) -> Result<()> {
        init::handler(ctx)
    }

    /// The `enter()` instruction initializes a user's [RewardsAccount](#rewards-account).
    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        enter::handler(ctx)
    }

    /// The `addFee()` instruction sends amount of tokens to the [VaultAccount](#vault-account).
    pub fn add_fee(ctx: Context<AddFee>, amount: u64) -> Result<()> {
        add_fee::handler(ctx, amount)
    }

    /// The `claim()` instruction sends a user's rewards to a given wallet.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    /// The `sync()` instruction re-calculates a users' reflection points.
    pub fn sync(ctx: Context<Sync>) -> Result<()> {
        sync::handler(ctx)
    }

    /// The `close()` instruction closes a users' [RewardsAccount](#rewards-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }
}

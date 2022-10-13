mod instructions;
mod macros;
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
        ctx.accounts.handler(*ctx.bumps.get("vault").unwrap())
    }

    /// The `enter()` instruction initializes a user's [RewardsAccount](#rewards-account).
    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        ctx.accounts.handler(*ctx.bumps.get("reward").unwrap())
    }

    /// The `addFee()` instruction sends amount of tokens to the [VaultAccount](#vault-account).
    pub fn add_fee(ctx: Context<AddFee>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    /// The `claim()` instruction sends a user's rewards to a given wallet.
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// The `sync()` instruction re-calculates a users' reflection points.
    pub fn sync(ctx: Context<Sync>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// The `close()` instruction closes a users' [RewardsAccount](#rewards-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }
}

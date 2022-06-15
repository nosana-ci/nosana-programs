mod error;
mod ids;
mod instructions;
mod state;
mod utils;

use error::*;
use ids::*;
use instructions::*;
use state::*;

use anchor_lang::prelude::*;

#[program]
pub mod nosana_staking {
    use super::*;

    pub fn init_vault(_ctx: Context<InitVault>, _bump: u8) -> Result<()> {
        init_vault::handler()
    }

    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
        stake::handler(ctx, amount, duration)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        unstake::handler(ctx)
    }

    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        topup::handler(ctx, amount)
    }

    pub fn claim(ctx: Context<Claim>, bump: u8) -> Result<()> {
        claim::handler(ctx, bump)
    }

    pub fn emit_rank(ctx: Context<EmitRank>) -> Result<()> {
        emit_rank::handler(ctx)
    }
}

mod ids;
mod instructions;
mod utils;

use ids::*;
use instructions::*;

use anchor_lang::prelude::*;

#[program]
pub mod nosana_staking {
    use super::*;

    pub fn init_vault(_ctx: Context<InitVault>, _bump: u8) -> Result<()> {
        init_vault::handler()
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        stake::handler(ctx, amount)
    }

    pub fn unstake(ctx: Context<Unstake>, bump: u8, amount: u64) -> Result<()> {
        unstake::handler(ctx, bump, amount)
    }
}

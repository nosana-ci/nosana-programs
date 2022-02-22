mod macros;

use anchor_lang::prelude::*;
use anchor_spl::token::{self};

mod instructions;
mod ids;
mod state;
mod utils;

use instructions::*;
use ids::*;
use state::*;
use utils::*;

#[program]
pub mod jobs {
    use super::*;

    pub fn create_user(ctx: Context<Initialize>, _bump: u8) -> ProgramResult {
        let jobs = &mut ctx.accounts.jobs;
        jobs.payer = *ctx.accounts.authority.key;
        jobs.jobs = Vec::new();
        Ok(())
    }

    pub fn create_job(ctx: Context<Projects>, bump: u8, amount: u64) -> ProgramResult {
        create_job::handler(ctx, bump, amount)
    }
}

mod instructions;
mod ids;
mod state;
mod error;

use anchor_lang::prelude::*;
use anchor_spl::token::{self};

use instructions::*;
use ids::*;
use state::*;
use error::*;

#[program]
pub mod jobs {
    use super::*;

    pub fn init_vault(_ctx: Context<InitVault>, _bump: u8) -> ProgramResult {
        init_vault::handler()
    }

    pub fn init_project(ctx: Context<InitProject>) -> ProgramResult {
        init_project::handler(ctx)
    }

    pub fn create_job(ctx: Context<CreateJob>, _bump: u8, amount: u64) -> ProgramResult {
        create_job::handler(ctx, amount)
    }

    pub fn claim_job(ctx: Context<ClaimJob>) -> ProgramResult {
        claim_job::handler(ctx)
    }

    pub fn finish_job(ctx: Context<FinishJob>, bump: u8) -> ProgramResult {
        finish_job::handler(ctx, bump)
    }
}

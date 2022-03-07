mod error;
mod ids;
mod instructions;
mod state;

use error::*;
use ids::*;
use instructions::*;
use state::*;

use anchor_lang::prelude::*;
// use anchor_spl::token::{self};

#[program]
pub mod nosana_jobs {
    use super::*;

    pub fn init_vault(_ctx: Context<InitVault>, _bump: u8) -> Result<()> {
        init_vault::handler()
    }

    pub fn init_project(ctx: Context<InitProject>) -> Result<()> {
        init_project::handler(ctx)
    }

    pub fn create_job(
        ctx: Context<CreateJob>,
        _bump: u8,
        amount: u64,
        data: [u8; 32],
    ) -> Result<()> {
        create_job::handler(ctx, amount, data)
    }

    pub fn claim_job(ctx: Context<ClaimJob>) -> Result<()> {
        claim_job::handler(ctx)
    }

    pub fn finish_job(ctx: Context<FinishJob>, bump: u8, data: [u8; 32]) -> Result<()> {
        finish_job::handler(ctx, bump, data)
    }

    pub fn cancel_job(ctx: Context<CancelJob>, bump: u8) -> Result<()> {
        cancel_job::handler(ctx, bump)
    }
}

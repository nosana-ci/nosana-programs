mod instructions;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::jobs;
use state::*;

declare_id!(jobs::ID);

#[program]
pub mod nosana_jobs {
    use super::*;

    pub fn init_vault(_ctx: Context<InitVault>) -> Result<()> {
        init_vault::handler()
    }

    pub fn init_project(ctx: Context<InitProject>) -> Result<()> {
        init_project::handler(ctx)
    }

    pub fn create_job(ctx: Context<CreateJob>, amount: u64, data: [u8; 32]) -> Result<()> {
        create_job::handler(ctx, amount, data)
    }

    pub fn claim_job(ctx: Context<ClaimJob>) -> Result<()> {
        claim_job::handler(ctx)
    }

    pub fn close_job(ctx: Context<CloseJob>) -> Result<()> {
        close_job::handler(ctx)
    }

    pub fn reclaim_job(ctx: Context<ReclaimJob>) -> Result<()> {
        reclaim_job::handler(ctx)
    }

    pub fn finish_job(ctx: Context<FinishJob>, data: [u8; 32]) -> Result<()> {
        finish_job::handler(ctx, data)
    }

    pub fn cancel_job(ctx: Context<CancelJob>) -> Result<()> {
        cancel_job::handler(ctx)
    }
}

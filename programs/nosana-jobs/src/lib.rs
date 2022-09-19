mod instructions;
mod security;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::*;
use state::*;

declare_id!(id::JOBS_PROGRAM);

#[program]
pub mod nosana_jobs {
    use super::*;

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        cancel::handler(ctx)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }

    pub fn create(ctx: Context<Create>, ipfs_job: [u8; 32]) -> Result<()> {
        create::handler(ctx, ipfs_job)
    }

    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        enter::handler(ctx)
    }

    pub fn exit(ctx: Context<Exit>) -> Result<()> {
        exit::handler(ctx)
    }

    pub fn finish(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
        finish::handler(ctx, ipfs_result)
    }

    pub fn init(ctx: Context<Init>, job_price: u64, job_timeout: i64, job_type: u8) -> Result<()> {
        init::handler(ctx, job_price, job_timeout, job_type)
    }
}

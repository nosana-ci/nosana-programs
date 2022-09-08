extern crate core;

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

    pub fn init(ctx: Context<Init>, job_size: u8) -> Result<()> {
        init::handler(ctx, job_size)
    }

    pub fn create(ctx: Context<Create>, amount: u64, data: [u8; 32]) -> Result<()> {
        create::handler(ctx, amount, data)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    pub fn finish(ctx: Context<Finish>, data: [u8; 32]) -> Result<()> {
        finish::handler(ctx, data)
    }
}

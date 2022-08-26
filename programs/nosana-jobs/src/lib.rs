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

    pub fn init(_ctx: Context<Init>) -> Result<()> {
        init::handler()
    }

    pub fn start(ctx: Context<Start>) -> Result<()> {
        start::handler(ctx)
    }

    pub fn stop(_ctx: Context<Stop>) -> Result<()> {
        stop::handler()
    }

    pub fn create(ctx: Context<Create>, amount: u64, data: [u8; 32]) -> Result<()> {
        create::handler(ctx, amount, data)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }

    pub fn reclaim(ctx: Context<Reclaim>) -> Result<()> {
        reclaim::handler(ctx)
    }

    pub fn finish(ctx: Context<Finish>, data: [u8; 32]) -> Result<()> {
        finish::handler(ctx, data)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        cancel::handler(ctx)
    }
}

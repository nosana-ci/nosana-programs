mod errors;
mod instructions;
mod macros;
mod security;
mod state;
mod types;

use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use nosana_common::*;
use state::*;
use types::*;

declare_id!(id::JOBS_PROGRAM);

#[program]
pub mod nosana_jobs {
    use super::*;

    /***
     Admin Instructions
    */

    pub fn open(
        ctx: Context<Open>,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_xnos_minimum: u128,
    ) -> Result<()> {
        ctx.accounts.handler(
            job_expiration,
            job_price,
            job_timeout,
            job_type,
            node_xnos_minimum,
            *ctx.bumps.get("vault").unwrap(),
        )
    }

    pub fn update(
        ctx: Context<Update>,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_stake_minimum: u128,
    ) -> Result<()> {
        ctx.accounts.handler(
            job_expiration,
            job_price,
            job_timeout,
            job_type,
            node_stake_minimum,
        )
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    /***
     Project Instructions
    */

    pub fn list(ctx: Context<List>, ipfs_job: [u8; 32]) -> Result<()> {
        ctx.accounts.handler(ipfs_job)
    }

    pub fn recover(ctx: Context<Recover>) -> Result<()> {
        ctx.accounts.handler()
    }

    /***
     Node Instructions
    */

    pub fn work(ctx: Context<Work>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn stop(ctx: Context<Stop>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn finish(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
        ctx.accounts.handler(ipfs_result)
    }

    pub fn quit(ctx: Context<Quit>) -> Result<()> {
        ctx.accounts.handler()
    }

    /***
     Other Instructions
    */

    pub fn clean(ctx: Context<Clean>) -> Result<()> {
        ctx.accounts.handler()
    }
}

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

    /// Initialize a [MarketAccount](#market-account) and [VaultAccount](#vault-account).
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

    /// Update a [MarketAccount](#market-account)'s configurations.
    pub fn update(
        ctx: Context<Update>,
        job_expiration: i64,
        job_price: u64,
        job_type: u8,
        node_stake_minimum: u128,
    ) -> Result<()> {
        ctx.accounts
            .handler(job_expiration, job_price, job_type, node_stake_minimum)
    }

    /// Close a [MarketAccount](#market-account) and the associated [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Close a [MarketAccount](#market-account) and the associated [VaultAccount](#vault-account).
    pub fn close_admin(ctx: Context<CloseAdmin>) -> Result<()> {
        ctx.accounts.handler()
    }

    /***
     Project Instructions
    */

    /// Create a [JobAccount](#job-account) and optional [RunAccount](#run-account).
    pub fn list(ctx: Context<List>, ipfs_job: [u8; 32]) -> Result<()> {
        ctx.accounts.handler(ipfs_job)
    }

    /// Recover funds from a [JobAccount](#job-account) that has been [quit](#quit).
    pub fn recover(ctx: Context<Recover>) -> Result<()> {
        ctx.accounts.handler()
    }

    /***
     Node Instructions
    */

    /// Enters the [MarketAccount](#market-account) queue, or create  a [RunAccount](#run-account).
    pub fn work(ctx: Context<Work>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Exit the node queue from [MarketAccount](#market-account).
    pub fn stop(ctx: Context<Stop>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Claim a job that is [stopped](#stop).
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Post the result for a  [JobAccount](#job-account) to finish it and get paid.
    pub fn finish(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
        ctx.accounts.handler(ipfs_result)
    }

    /// Quit a [JobAccount](#job-account) that you have started.
    pub fn quit(ctx: Context<Quit>) -> Result<()> {
        ctx.accounts.handler()
    }

    /***
     Other Instructions
    */

    /// Close an [JobAccount](#job-account).
    pub fn clean(ctx: Context<Clean>) -> Result<()> {
        ctx.accounts.handler()
    }
}

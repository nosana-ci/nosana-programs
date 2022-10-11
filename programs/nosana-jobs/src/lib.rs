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

    /*************************************************************************
    ADMIN INSTRUCTIONS
    */

    /// ### Open
    /// The `open()` instruction initializes a [MarketAccount](#market-account)
    /// and [VaultAccount](#vault-account).
    pub fn open(
        ctx: Context<Open>,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_xnos_minimum: u64,
    ) -> Result<()> {
        open::handler(
            ctx,
            job_expiration,
            job_price,
            job_timeout,
            job_type,
            node_xnos_minimum,
        )
    }

    /// ### Update
    /// The `update()` instruction updates a [MarketAccount](#market-account) configurations.
    pub fn update(
        ctx: Context<Update>,
        job_expiration: i64,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_stake_minimum: u64,
    ) -> Result<()> {
        update::handler(
            ctx,
            job_expiration,
            job_price,
            job_timeout,
            job_type,
            node_stake_minimum,
        )
    }

    /// ### Close
    /// The `close()` instruction closes a [MarketAccount](#market-account) and the
    /// associated [VaultAccount](#vault-account). The vault has to be empty of tokens.
    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }

    /*************************************************************************
    PROJECT INSTRUCTIONS
    */

    /// ### List
    /// The `list()` instruction lists a job, with its required data.
    /// When there is a job available, a [RunAccount](#run-account) will automatically be created.
    pub fn list(ctx: Context<List>, ipfs_job: [u8; 32]) -> Result<()> {
        list::handler(ctx, ipfs_job)
    }

    /// ### Recover
    /// The `recover()` instruction recovers funds from a jobs that has been [Quit](#quit)'ed.
    pub fn recover(ctx: Context<Recover>) -> Result<()> {
        recover::handler(ctx)
    }

    /*************************************************************************
    NODE INSTRUCTIONS
    */

    /// ### Work
    /// With the `work()` instruction a node enters the [MarketAccount](#market-account) queue.
    /// When there is a job available, a [RunAccount](#run-account) will automatically be created.
    pub fn work(ctx: Context<Work>) -> Result<()> {
        work::handler(ctx)
    }

    /// ### Stop
    /// With the `stop()` instruction a node exits the node queue from a [MarketAccount](#market-account).
    pub fn stop(ctx: Context<Stop>) -> Result<()> {
        stop::handler(ctx)
    }

    /// ### Claim
    /// With the `claim()` instruction a node claims a job that is [stopped](#stop).
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    /// ### Finish
    /// With the `finish()` instruction a node can can post the result for a job it has finished,
    /// and be reimbursed for the work.
    pub fn finish(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
        finish::handler(ctx, ipfs_result)
    }

    /// ### Quit
    /// With the `quit()` instruction a node can quit a job that it has started.
    pub fn quit(ctx: Context<Quit>) -> Result<()> {
        quit::handler(ctx)
    }

    /*************************************************************************
    ANONYMOUS INSTRUCTIONS
    */

    /// ### Clean
    /// The `clean()` instruction closes an [JobAccount](#job-account).
    /// The job has be finished and the job expiration time has to be exceeded.
    pub fn clean(ctx: Context<Clean>) -> Result<()> {
        clean::handler(ctx)
    }
}

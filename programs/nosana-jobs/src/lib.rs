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

    /// ### Open
    ///
    /// The `open()` instruction initializes a [MarketAccount](#market-account) and an
    /// associated [VaultAccount](#vault-account) for token deposits.
    ///
    pub fn open(
        ctx: Context<Open>,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_stake_minimum: u64,
    ) -> Result<()> {
        open::handler(ctx, job_price, job_timeout, job_type, node_stake_minimum)
    }

    /// ### Close
    ///
    /// The `close()` instruction closes a [MarketAccount](#market-account) and an
    /// associated [VaultAccount](#vault-account).
    /// The vault has to be empty of tokens.
    ///
    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }

    /// ### Update
    ///
    /// The `update()` instruction update a [MarketAccount](#market-account).
    ///
    pub fn update(
        ctx: Context<Update>,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_stake_minimum: u64,
    ) -> Result<()> {
        update::handler(ctx, job_price, job_timeout, job_type, node_stake_minimum)
    }

    /// ### List
    ///
    /// The `list()` instruction lists a job, with its required data.
    /// When there is a node ready in the queue it will immediately start running.
    /// The [JobAccount](#job-account) is optionally created
    ///
    pub fn list(ctx: Context<List>, ipfs_job: [u8; 32]) -> Result<()> {
        list::handler(ctx, ipfs_job)
    }

    /// ### Clean
    ///
    /// The `clean()` instruction closes an existing [JobAccount](#job-account).
    /// When the job was still queued the tokens will be returned to the user.
    ///
    pub fn clean(ctx: Context<Clean>) -> Result<()> {
        clean::handler(ctx)
    }

    /// ### Work
    ///
    /// With the `work()` instruction a node enters the [MarketAccount](#market-account) queue.
    ///
    /// A few requirements are enforced:
    ///
    /// - A node needs to have a minimum stake in Nosana Staking.
    /// - A node needs to hold an official Nosana NFT.
    /// - A node can only enter the queue once
    ///
    pub fn work(ctx: Context<Work>) -> Result<()> {
        work::handler(ctx)
    }

    /// ### Stop
    ///
    /// With the `stop()` instruction a node exits the node queue
    /// from a [MarketAccount](#market-account).
    ///
    pub fn stop(ctx: Context<Stop>) -> Result<()> {
        stop::handler(ctx)
    }

    /// ### Finish
    ///
    /// With the `finish()` instruction a node can can post the result for a job it has finished,
    /// and be reimbursed for the work.
    ///
    pub fn finish(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
        finish::handler(ctx, ipfs_result)
    }

    /// ### Quit
    ///
    /// With the `quit()` instruction a node can quit a job that it has started.
    ///
    pub fn quit(ctx: Context<Quit>) -> Result<()> {
        quit::handler(ctx)
    }
}

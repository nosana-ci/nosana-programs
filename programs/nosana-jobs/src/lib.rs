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

    /// ### Init
    ///
    /// The `init()` instruction initializes a [MarketAccount](#market-account) and an
    /// associated [VaultAccount](#vault-account) for token deposits.
    ///
    pub fn init(
        ctx: Context<Init>,
        job_price: u64,
        job_timeout: i64,
        job_type: u8,
        node_stake_minimum: u64,
    ) -> Result<()> {
        init::handler(ctx, job_price, job_timeout, job_type, node_stake_minimum)
    }

    /// ### Stop
    ///
    /// The `stop()` instruction closes a [MarketAccount](#market-account) and an
    /// associated [VaultAccount](#vault-account).
    /// The vault has to be empty of tokens.
    ///
    pub fn stop(ctx: Context<Stop>) -> Result<()> {
        stop::handler(ctx)
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

    /// ### Create
    ///
    /// The `create()` instruction creates a [JobAccount](#job-account) with its required data.
    /// When there is a node ready in the queue it will immediately start running.
    ///
    pub fn create(ctx: Context<Create>, ipfs_job: [u8; 32]) -> Result<()> {
        create::handler(ctx, ipfs_job)
    }

    /// ### Close
    ///
    /// The `close()` instruction closes an existing [JobAccount](#job-account).
    /// When the job was still queued the tokens will be returned to the user.
    ///
    pub fn close(ctx: Context<Close>) -> Result<()> {
        close::handler(ctx)
    }

    /// ### Cancel
    ///
    /// With the `cancel()` instruction a node can stop running a job that it has started.
    ///
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        cancel::handler(ctx)
    }

    /// ### Claim
    ///
    /// With the claim() instruction a node can claim a job that is:
    ///
    /// - In the Queued (`0`) state.
    /// - In the Running (`1`) state, but after is has expired.
    ///
    /// #### Unclaimed Jobs
    ///
    /// To find unclaimed jobs with Anchor:
    ///
    /// ```typescript
    /// const jobs = await program.account.jobAccount.all([
    ///   {
    ///     memcmp: {
    ///       offset: 8 + 32 * 3, /// the assigned node must be NULL
    ///       bytes: systemProgram.toBase58(),
    ///     },
    ///   },
    ///   {
    ///     memcmp: {
    ///       offset: 8 + 32 * 4, /// the nodes queue
    ///       bytes: nodes.toBase58(),
    ///     },
    ///   },
    ///   {
    ///     memcmp: {
    ///       offset: 8 + 32 * 5 + 8, /// the job status
    ///       bytes: '1',
    ///     },
    ///   },
    /// ]);
    /// ```
    /// Note: leave the nodes out to find jobs across all node queues.
    ///
    /// #### Expired Jobs
    ///
    /// To find jobs that have timed out, we first find all running jobs.
    ///
    /// ```typescript
    /// const jobs = await program.account.jobAccount.all([
    ///   {
    ///     memcmp: {
    ///       offset: 8 + 32 * 4, // the nodes queue
    ///       bytes: nodes.toBase58(),
    ///     },
    ///   },
    ///   {
    ///     memcmp: {
    ///       offset: 8 + 32 * 5 + 8, ///the job status
    ///       bytes: '2',
    ///     },
    ///   },
    /// ]);
    /// ```
    ///
    /// With the retrieved running jobs we can find jobs that have expired,
    /// by checking their start time:
    ///
    /// ```typescript
    /// for (const job of jobs) {
    ///   if (job.account.timeStart > (Date.now() / 1e3 - nodes.jobTimeout)) {
    ///     /// claim job!
    ///   }
    /// }
    /// ```
    ///
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    /// ### Enter
    ///
    /// With the `enter()` instruction a node enters the [MarketAccount](#market-account) queue.
    ///
    /// A few requirements are enforced:
    ///
    /// - A node needs to have a minimum stake in Nosana Staking.
    /// - A node needs to hold an official Nosana NFT.
    /// - A node can only enter the queue once
    ///
    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        enter::handler(ctx)
    }

    /// ### Exit
    ///
    /// With the `exit()` instruction a node exits the node queue
    /// from a [MarketAccount](#market-account).
    ///
    pub fn exit(ctx: Context<Exit>) -> Result<()> {
        exit::handler(ctx)
    }

    /// ### Finish
    ///
    /// With the `finish()` instruction a node can can post the result for a job it has finished,
    /// and be reimbursed for the work.
    ///
    pub fn finish(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
        finish::handler(ctx, ipfs_result)
    }
}

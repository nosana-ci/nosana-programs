use crate::*;
use nosana_staking::cpi::accounts::EmitRank;
use nosana_staking::program::NosanaStaking;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    #[account(mut, owner = ID.key())]
    pub jobs: Account<'info, Jobs>,
    #[account(mut, owner = ID.key())]
    pub job: Account<'info, Job>,
    pub stake: Box<Account<'info, StakeAccount>>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub staking_program: Program<'info, NosanaStaking>,
}

pub fn handler(ctx: Context<ClaimJob>) -> Result<()> {
    // get job and check if it's not initialized
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Initialized as u8,
        NosanaError::JobNotInitialized
    );

    // verify node
    let _rank = nosana_staking::cpi::emit_rank(CpiContext::new(
        ctx.accounts.staking_program.to_account_info(),
        EmitRank {
            clock: ctx.accounts.clock.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            stake: ctx.accounts.stake.to_account_info(),
        },
    ));
    // require!(rank.xnos > 100, NosanaError::NodeNotVerified);

    // claim
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );

    // get jobs and remove the job from the list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

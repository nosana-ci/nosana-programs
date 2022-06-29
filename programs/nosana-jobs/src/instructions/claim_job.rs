use crate::*;
use nosana_staking::program::NosanaStaking;

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    #[account(mut, owner = ID.key())]
    pub jobs: Account<'info, Jobs>,
    #[account(mut, owner = ID.key())]
    pub job: Account<'info, Job>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub staking_program: Program<'info, NosanaStaking>,
}

pub fn handler(ctx: Context<ClaimJob>) -> Result<()> {
    // get job and claim it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Initialized as u8,
        NosanaError::JobNotInitialized
    );
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );

    // get jobs and remove the job from the list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

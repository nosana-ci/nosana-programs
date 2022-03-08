use crate::*;

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    #[account(mut)]
    pub jobs: Account<'info, Jobs>,
    #[account(mut)]
    pub job: Account<'info, Job>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ClaimJob>) -> Result<()> {
    // get job and claim it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Initialized as u8,
        NosanaError::NotClaimable
    );
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );

    // get jobs and remove the job from the list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

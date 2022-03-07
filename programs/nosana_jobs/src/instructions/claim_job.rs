use crate::*;

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    #[account(mut)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimJob>) -> Result<()> {
    // get job
    let job: &mut Account<Job> = &mut ctx.accounts.job;

    // run checks
    require!(
        job.job_status == JobStatus::Created as u8,
        NosanaError::NotClaimable
    );

    // claim job
    job.claim(*ctx.accounts.authority.key);

    // get jobs
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

use crate::*;

#[derive(Accounts)]
pub struct ReclaimJob<'info> {
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Claimed as u8 @ NosanaError::JobNotClaimed,
        constraint = Clock::get()?.unix_timestamp - job.time_start >= state::TIMEOUT @ NosanaError::JobNotTimedOut,
    )]
    pub job: Account<'info, Job>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ReclaimJob>) -> Result<()> {
    // get job and claim it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.claim(*ctx.accounts.authority.key, Clock::get()?.unix_timestamp);
    Ok(())
}

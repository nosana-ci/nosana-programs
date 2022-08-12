use crate::*;
use nosana_common::error::NosanaError;

#[derive(Accounts)]
pub struct ReclaimJob<'info> {
    #[account(mut, owner = ID.key())]
    pub job: Account<'info, Job>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ReclaimJob>) -> Result<()> {
    // get job and check status
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Claimed as u8,
        NosanaError::JobNotClaimed
    );

    // check time
    let clock: &Sysvar<Clock> = &mut ctx.accounts.clock;
    require!(
        clock.unix_timestamp.checked_sub(job.time_start).unwrap() >= state::TIMEOUT,
        NosanaError::JobNotTimedOut
    );

    // claim it
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );
    Ok(())
}

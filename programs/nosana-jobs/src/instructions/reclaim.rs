use crate::*;

#[derive(Accounts)]
pub struct Reclaim<'info> {
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Claimed as u8 @ NosanaError::JobNotClaimed,
        constraint = Clock::get()?.unix_timestamp - job.time_start >= state::TIMEOUT @ NosanaError::JobNotTimedOut,
    )]
    pub job: Account<'info, JobAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Reclaim>) -> Result<()> {
    // get job and claim it
    (&mut ctx.accounts.job).claim(ctx.accounts.authority.key(), Clock::get()?.unix_timestamp);
    Ok(())
}

use crate::*;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct CloseJob<'info> {
    #[account(mut, close = authority, owner = ID.key())]
    pub job: Account<'info, Job>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CloseJob>) -> Result<()> {
    // get job and check status
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Finished as u8,
        NosanaError::JobNotClaimed
    );
    require!(
        job.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    Ok(())
}

use crate::*;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        constraint = job.job_status == JobStatus::Finished as u8 @ NosanaError::JobNotClaimed,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(_ctx: Context<Close>) -> Result<()> {
    Ok(())
}

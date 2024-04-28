use crate::*;

#[derive(Accounts)]
pub struct Clean<'info> {
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        constraint = job.state == JobState::Done as u8 @ NosanaJobsError::JobInWrongState,
        constraint = market.job_expiration < Clock::get()?.unix_timestamp - job.time_end
            @ NosanaJobsError::JobNotExpired,
    )]
    pub job: Account<'info, JobAccount>,
    pub market: Account<'info, MarketAccount>,
    /// CHECK: this account is verified as the original payer for the job
    #[account(mut)]
    pub payer: AccountInfo<'info>,
}

impl<'info> Clean<'info> {
    pub fn handler(&self) -> Result<()> {
        Ok(())
    }
}

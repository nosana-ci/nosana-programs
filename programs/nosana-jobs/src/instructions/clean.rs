use crate::*;

#[derive(Accounts)]
pub struct Clean<'info> {
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        constraint = job.status == JobStatus::Done as u8 @ NosanaError::JobInWrongState,
        constraint = market.job_expiration < Clock::get()?.unix_timestamp - job.time_end
            @ NosanaError::JobNotExpired,
    )]
    pub job: Account<'info, JobAccount>,
    pub market: Account<'info, MarketAccount>,
    /// CHECK: this account is verified as the original payer for the job
    pub payer: AccountInfo<'info>,
}

pub fn handler(_ctx: Context<Clean>) -> Result<()> {
    Ok(())
}

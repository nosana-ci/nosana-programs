use crate::*;

#[derive(Accounts)]
pub struct CleanAdmin<'info> {
    #[account(mut, close = payer, has_one = payer @ NosanaError::InvalidPayer)]
    pub job: Account<'info, JobAccount>,
    /// CHECK: this account is verified as the original payer for the job
    pub payer: AccountInfo<'info>,
    #[account(address = id::MARKET_ADMIN @ NosanaError::Unauthorized)]
    pub authority: Signer<'info>,
}

impl<'info> CleanAdmin<'info> {
    pub fn handler(&self) -> Result<()> {
        Ok(())
    }
}

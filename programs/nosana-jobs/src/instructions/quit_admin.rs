use crate::*;

#[derive(Accounts)]
pub struct QuitAdmin<'info> {
    #[account(mut, close = payer, has_one = payer @ NosanaError::InvalidPayer)]
    pub run: Account<'info, RunAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    #[account(address = id::MARKET_ADMIN @ NosanaError::Unauthorized)]
    pub authority: Signer<'info>,
}

impl<'info> QuitAdmin<'info> {
    pub fn handler(&mut self) -> Result<()> {
        Ok(())
    }
}

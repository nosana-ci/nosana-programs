use crate::*;

#[derive(Accounts)]
pub struct CloseSettings<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        mut,
        close = authority,
        seeds = [ constants::PREFIX_SETTINGS, market.key().as_ref() ],
        bump,
    )]
    pub market_settings: Account<'info, MarketSettingsAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> CloseSettings<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.market.restrict(false);
        Ok(())
    }
}

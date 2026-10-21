use crate::*;

#[derive(Accounts)]
pub struct SetSettings<'info> {
    #[account(has_one = authority @ NosanaError::Unauthorized)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        space = MarketSettingsAccount::SIZE,
        seeds = [ constants::PREFIX_SETTINGS, market.key().as_ref() ],
        bump,
    )]
    pub market_settings: Account<'info, MarketSettingsAccount>,
    /// CHECK: Only the account address is needed for a project access key
    pub project_access_key: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> SetSettings<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.market_settings.set(self.project_access_key.key())
    }
}

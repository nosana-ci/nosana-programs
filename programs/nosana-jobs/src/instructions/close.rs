use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority @ NosanaError::Unauthorized,
        has_one = vault @ NosanaError::InvalidVault,
        constraint = !market.is_restricted() || market_settings.is_some()
            @ NosanaJobsError::MarketSettingsMissing,
    )]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: the address is pinned by the seeds, closed with the market when it is initialized
    #[account(mut, seeds = [ constants::PREFIX_SETTINGS, market.key().as_ref() ], bump)]
    pub market_settings: Option<UncheckedAccount<'info>>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        transfer_tokens_from_vault!(
            self,
            user,
            seeds!(self.market, self.vault),
            self.vault.amount
        )?;
        close_vault!(self, seeds!(self.market, self.vault))?;
        if let Some(settings) = &self.market_settings {
            MarketSettingsAccount::close(settings, &self.authority)?;
        }
        Ok(())
    }
}

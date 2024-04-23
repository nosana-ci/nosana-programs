use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct CloseAdmin<'info> {
    #[account(mut, close = authority, has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(address = id::MARKET_ADMIN @ NosanaError::Unauthorized)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> CloseAdmin<'info> {
    pub fn handler(&self) -> Result<()> {
        transfer_tokens_from_vault!(
            self,
            user,
            seeds!(self.market, self.vault),
            self.vault.amount
        )?;
        close_vault!(self, seeds!(self.market, self.vault))
    }
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority @ NosanaError::Unauthorized,
        has_one = vault @ NosanaError::InvalidVault,
    )]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
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

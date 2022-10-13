use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = authority @ NosanaError::Unauthorized,
        has_one = vault @ NosanaError::InvalidVault,
        constraint = pool.closeable || vault.amount == 0 @ NosanaError::PoolNotCloseable
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        transfer_tokens_from_vault!(self, user, seeds!(self.pool), self.vault.amount)?;
        close_vault!(self, seeds!(self.pool))
    }
}

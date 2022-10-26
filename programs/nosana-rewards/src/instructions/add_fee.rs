use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct AddFee<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> AddFee<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        self.reflection.add_fee(u128::from(amount));
        transfer_tokens_to_vault!(self, amount)
    }
}

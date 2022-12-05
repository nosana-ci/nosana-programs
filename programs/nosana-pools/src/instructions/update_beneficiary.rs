use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct UpdateBeneficiary<'info> {
    #[account(token::authority = authority.key())]
    pub beneficiary: Account<'info, TokenAccount>,
    #[account(token::mint = beneficiary.mint)]
    pub new_beneficiary: Account<'info, TokenAccount>,
    #[account(mut, has_one = beneficiary @ NosanaPoolsError::WrongBeneficiary)]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> UpdateBeneficiary<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.pool.update_beneficiary(self.new_beneficiary.key())
    }
}

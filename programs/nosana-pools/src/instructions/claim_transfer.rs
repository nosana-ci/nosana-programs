use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct ClaimTransfer<'info> {
    #[account(mut, address = pool.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub beneficiary: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = beneficiary @ NosanaPoolsError::WrongBeneficiary,
        constraint = Clock::get()?.unix_timestamp > pool.start_time @ NosanaPoolsError::NotStarted,
        constraint = pool.claim_type == ClaimType::Transfer as u8 @ NosanaPoolsError::WrongClaimType,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> ClaimTransfer<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let amount: u64 = self
            .pool
            .claim(self.vault.amount, Clock::get()?.unix_timestamp);

        // TODO: the below is not a requirement anymore, can be removed?
        // the pool must have enough funds for an emission
        require_gte!(amount, self.pool.emission, NosanaPoolsError::Underfunded);

        // transfer tokens from the vault back to the user
        transfer_tokens_from_vault!(self, beneficiary, seeds!(self.pool), amount)
    }
}

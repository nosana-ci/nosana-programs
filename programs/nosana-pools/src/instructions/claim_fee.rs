use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct ClaimFee<'info> {
    #[account(mut, address = pool.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub rewards_reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = Clock::get()?.unix_timestamp > pool.start_time @ NosanaPoolsError::NotStarted,
        constraint = pool.claim_type == ClaimType::AddFee as u8 @ NosanaPoolsError::WrongClaimType,
        constraint = pool.beneficiary == rewards_vault.key() @ NosanaPoolsError::WrongBeneficiary,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rewards_program: Program<'info, NosanaRewards>,
}

impl<'info> ClaimFee<'info> {
    pub fn handler(&mut self) -> Result<()> {
        // determine amount
        let amount: u64 = self
            .pool
            .claim(self.vault.amount, Clock::get()?.unix_timestamp);

        // stop early when there is no error
        if amount < self.pool.emission {
            return Ok(());
        }

        transfer_fee!(self, vault, vault, seeds!(self.pool), amount)
    }
}

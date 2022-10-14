use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = vault @ NosanaError::InvalidVault,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaStakingError::NotUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Withdraw<'info> {
    pub fn handler(&mut self) -> Result<()> {
        let amount: u64 = self
            .stake
            .withdraw(self.vault.amount, Clock::get()?.unix_timestamp);
        transfer_tokens_from_vault!(self, user, seeds!(self.stake, self.vault), amount)
    }
}

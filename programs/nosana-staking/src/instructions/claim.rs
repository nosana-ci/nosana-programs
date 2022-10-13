use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut, address = stake.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaError::StakeNotUnstaked,
        constraint = stake.time_unstake + i64::try_from(stake.duration).unwrap() <
            Clock::get()?.unix_timestamp @ NosanaError::StakeLocked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn handler(&self) -> Result<()> {
        transfer_tokens_from_vault!(
            self,
            user,
            seeds!(self.stake, self.vault),
            self.vault.amount
        )?;
        close_vault!(self, seeds!(self.stake, self.vault))
    }
}

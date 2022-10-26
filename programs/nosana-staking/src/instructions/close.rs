use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = vault @ NosanaError::InvalidVault,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaStakingError::NotUnstaked,
        constraint = stake.time_unstake + i64::try_from(stake.duration).unwrap() <
            Clock::get()?.unix_timestamp @ NosanaStakingError::Locked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, constraint = vault.amount == 0 @ NosanaError::VaultNotEmpty)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(&self) -> Result<()> {
        close_vault!(self, seeds!(self.stake, self.vault))
    }
}

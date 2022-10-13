use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        seeds = [ constants::PREFIX_SETTINGS.as_ref() ],
        bump,
    )]
    pub settings: Account<'info, SettingsAccount>,
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, address = settings.token_account @ NosanaError::InvalidTokenAccount)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut, address = stake.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Slash<'info> {
    pub fn handler(&mut self, amount: u64) -> Result<()> {
        // test amount
        require!(
            amount <= self.stake.amount,
            NosanaError::StakeAmountNotEnough
        );

        // slash stake
        self.stake.slash(amount);
        transfer_tokens_from_vault!(self, token_account, seeds!(self.stake, self.vault), amount)
    }
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Recover<'info> {
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        has_one = market @ NosanaError::InvalidMarketAccount,
        constraint = job.project == authority.key() @ NosanaError::Unauthorized,
        constraint = job.state == JobState::Stopped as u8 @ NosanaError::JobInWrongState,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the job
    pub payer: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Recover<'info> {
    pub fn handler(&self) -> Result<()> {
        utils::cpi_transfer_tokens(
            self.vault.to_account_info(),
            self.user.to_account_info(),
            self.vault.to_account_info(),
            self.token_program.to_account_info(),
            seeds!(self.market),
            self.job.price,
        )
    }
}

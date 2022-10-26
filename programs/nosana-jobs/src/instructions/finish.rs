use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Finish<'info> {
    #[account(mut, has_one = market @ NosanaJobsError::InvalidMarketAccount)]
    pub job: Account<'info, JobAccount>,
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        has_one = job @ NosanaJobsError::InvalidJobAccount,
        constraint = run.node == authority.key() @ NosanaError::Unauthorized,
    )]
    pub run: Account<'info, RunAccount>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Finish<'info> {
    pub fn handler(&mut self, ipfs_result: [u8; 32]) -> Result<()> {
        self.job.finish(
            ipfs_result,
            self.authority.key(),
            Clock::get()?.unix_timestamp,
        );
        // reimburse node
        transfer_tokens_from_vault!(
            self,
            user,
            seeds!(self.market, self.vault),
            self.job.price
        )
    }
}

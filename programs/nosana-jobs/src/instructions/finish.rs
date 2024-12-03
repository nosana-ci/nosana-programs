use crate::*;
use anchor_spl::{
    associated_token,
    token::{Token, TokenAccount},
};

#[derive(Accounts)]
pub struct Finish<'info> {
    #[account(
        mut,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        has_one = project @ NosanaJobsError::JobInvalidProject,
    )]
    pub job: Box<Account<'info, JobAccount>>,
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        has_one = job @ NosanaJobsError::InvalidJobAccount,
        constraint = run.node == authority.key() @ NosanaError::Unauthorized,
    )]
    pub run: Box<Account<'info, RunAccount>>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = job.price == 0 || deposit.key() == associated_token::get_associated_token_address(project.key, &id::NOS_TOKEN) @ NosanaError::InvalidATA
    )]
    pub deposit: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = job.price == 0 || user.mint == id::NOS_TOKEN @ NosanaError::InvalidATA
    )]
    pub user: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    /// CHECK: this account is verified as the original project for the job account
    #[account(mut)]
    pub project: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Finish<'info> {
    pub fn handler(&mut self, ipfs_result: [u8; 32]) -> Result<()> {
        require!(
            ipfs_result != JobAccount::NULL_RESULT,
            NosanaJobsError::JobResultNull
        );

        self.job.finish(
            ipfs_result,
            self.authority.key(),
            Clock::get()?.unix_timestamp,
            self.run.time,
        );

        if self.job.price == 0 {
            return Ok(());
        }

        // reimburse node, and refund surplus
        let total: u64 = self.job.get_deposit(self.job.timeout);
        let amount: u64 = self.job.get_reimbursement();
        let refund: u64 = total - amount;
        transfer_tokens_from_vault!(self, user, seeds!(self.market, self.vault), amount)?;
        transfer_tokens_from_vault!(self, deposit, seeds!(self.market, self.vault), refund)
    }
}

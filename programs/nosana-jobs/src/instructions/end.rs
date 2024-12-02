use crate::*;
use anchor_spl::{
    associated_token,
    token::{Token, TokenAccount},
};

#[derive(Accounts)]
pub struct End<'info> {
    #[account(
    mut,
    has_one = market @ NosanaJobsError::InvalidMarketAccount,
    has_one = project @ NosanaJobsError::JobInvalidProject,
    constraint = job.payer == authority.key() @ NosanaError::Unauthorized
  )]
    pub job: Box<Account<'info, JobAccount>>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(
    mut,
    close = payer,
    has_one = payer @ NosanaError::InvalidPayer,
    has_one = job @ NosanaJobsError::InvalidJobAccount,
    constraint = run.job == job.key() @ NosanaJobsError::JobInvalidRunAccount)]
    pub run: Account<'info, RunAccount>,
    #[account(
    mut,
    constraint = job.price == 0 || deposit.key() == associated_token::get_associated_token_address(project.key, &id::NOS_TOKEN) @ NosanaError::InvalidATA
  )]
    pub deposit: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    // TODO: Add validation to job.node == user.key()?
    pub user: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// CHECK: this account is verified as the original project for the job account
    #[account(mut)]
    pub project: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

impl<'info> End<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.job.stop(
            self.run.time,
            Clock::get()?.unix_timestamp,
            Some(self.run.node),
        );

        let deposit: u64 = self.job.get_deposit(self.job.timeout);

        if deposit > 0 {
            let amount: u64 = self.job.get_reimbursement();
            let refund: u64 = deposit - amount;
            transfer_tokens_from_vault!(self, user, seeds!(self.market, self.vault), amount)?;
            transfer_tokens_from_vault!(self, deposit, seeds!(self.market, self.vault), refund)
        } else {
            Ok(())
        }
    }
}

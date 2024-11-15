use crate::*;
use anchor_spl::{
    associated_token,
    token::{Token, TokenAccount},
};

#[derive(Accounts)]
pub struct Cancel<'info> {
    // Job Account
    #[account(
        mut,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        has_one = project @ NosanaJobsError::JobInvalidProject,
        constraint = job.payer == authority.key() @ NosanaError::Unauthorized
    )]
    pub job: Box<Account<'info, JobAccount>>,

    // Market Account
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,

    // Run Account
    pub run: Option<Account<'info, RunAccount>>,

    // Token Accounts
    #[account(
        mut,
        constraint = job.price == 0 || deposit.key() == associated_token::get_associated_token_address(project.key, &id::NOS_TOKEN) @ NosanaError::InvalidATA
    )]
    pub deposit: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub user: Option<Account<'info, TokenAccount>>,

    // Token Program
    pub token_program: Program<'info, Token>,

    // Authority
    /// CHECK: this account is verified as the original project for the job account
    #[account(mut)]
    pub project: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

impl<'info> Cancel<'info> {
    pub fn handler(&mut self) -> Result<()> {
        msg!("Job state: {}", self.job.state);

        // TODO: DO NOT USE QUEUED AS STATE DOES NOT GO TO RUNNING, CHECK IF RUN ACCOUNT EXISTS

        if self.job.state == JobState::Queued as u8 {
            self.job.cancel(0, 0);

            let deposit: u64 = self.job.get_deposit(self.job.timeout);
            if deposit > 0 {
                transfer_tokens_from_vault!(
                    self,
                    deposit,
                    seeds!(self.market, self.vault),
                    deposit
                )?;
            }

            self.market.remove_from_queue(&self.job.key())
        } else {
            let run = self.run.as_ref().unwrap();
            let user = self.user.as_ref().unwrap();

            self.job.cancel(run.time, Clock::get()?.unix_timestamp);

            // reimburse node. and refund surplus
            let deposit: u64 = self.job.get_deposit(self.job.timeout);
            if deposit > 0 {
                let amount: u64 = self.job.get_reimbursement();
                let refund: u64 = deposit - amount;
                cpi::transfer_tokens(
                    self.token_program.to_account_info(),
                    self.vault.to_account_info(),
                    user.to_account_info(),
                    self.vault.to_account_info(),
                    seeds!(self.market, self.vault),
                    amount,
                )?;
                transfer_tokens_from_vault!(self, deposit, seeds!(self.market, self.vault), refund)
            } else {
                Ok(())
            }
        }
    }
}

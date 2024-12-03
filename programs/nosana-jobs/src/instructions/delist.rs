use crate::*;
use anchor_spl::{
    associated_token,
    token::{Token, TokenAccount},
};

#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(
        mut,
        close = payer,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        constraint = job.project == authority.key() @ NosanaError::Unauthorized,
        constraint = job.state == JobState::Queued as u8 @NosanaJobsError::JobInWrongState
  )]
    pub job: Box<Account<'info, JobAccount>>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        mut,
        constraint = job.price == 0 || deposit.key() == associated_token::get_associated_token_address(project.key, &id::NOS_TOKEN) @ NosanaError::InvalidATA
    )]
    pub deposit: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// CHECK: this account is verified as the original project for the job account
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Delist<'info> {
    pub fn handler(&mut self) -> Result<()> {
        if self.market.queue_type == QueueType::Job as u8 {
            self.market.remove_from_queue(&self.job.key())?;
        }

        let deposit: u64 = self.job.get_deposit(self.job.timeout);

        if deposit > 0 {
            transfer_tokens_from_vault!(self, deposit, seeds!(self.market, self.vault), deposit)
        } else {
            Ok(())
        }
    }
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        constraint = job.project == authority.key() @ NosanaError::Unauthorized,
        constraint = job.state == JobState::Queued as u8 @NosanaJobsError::JobInWrongState
    )]
    pub job: Account<'info, JobAccount>,
    #[account(
        mut,
        has_one = vault @ NosanaError::InvalidVault,
        constraint = market.queue_type == QueueType::Job as u8 @NosanaJobsError::MarketInWrongState
    )]
    pub market: Account<'info, MarketAccount>,
    #[account(
        mut,
        constraint = deposit.mint == id::NOS_TOKEN @ NosanaError::InvalidATA
    )]
    pub deposit: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the job account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Delist<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.market.remove_from_queue(&self.job.key())?;

        if job.price == 0 {
            Ok(())
        }

        // refund deposit
        let refund: u64 = self.job.get_deposit(self.job.timeout);
        if refund > 0 {
            transfer_tokens_from_vault!(self, deposit, seeds!(self.market, self.vault), refund)
        } else {
            Ok(())
        }
    }
}

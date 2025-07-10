use crate::*;
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{Token, TokenAccount},
};

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
        constraint = job.price == 0 ||
            deposit.key() == get_associated_token_address(payer.key, &id::NOS_TOKEN)
            @ NosanaError::InvalidATA
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
        match self.market.remove_from_queue(&self.job.key()) {
            Ok(_) => {
                if self.job.price == 0 {
                    return Ok(());
                }

                // refund deposit
                let total: u64 = self.job.get_deposit(self.job.timeout);
                transfer_tokens_from_vault!(self, deposit, seeds!(self.market, self.vault), total)
            }
            Err(err) => Err(err),
        }
    }
}

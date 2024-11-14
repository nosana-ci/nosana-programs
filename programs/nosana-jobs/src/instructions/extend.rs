use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        constraint = job.project == authority.key() @ NosanaError::Unauthorized,
        constraint = job.state == JobState::Queued as u8 @ NosanaJobsError::JobInWrongState,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub rewards_reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub rewards_program: Program<'info, NosanaRewards>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Extend<'info> {
    pub fn handler(&mut self, timeout: i64) -> Result<()> {
        // New timeout should be larger than old timeout
        if timeout <= self.job.timeout {
            return Ok(());
        }
        // If job price > 0, we need to topup
        if self.job.price > 0 {
            transfer_tokens_to_vault!(self, self.job.get_deposit(timeout - self.job.timeout))?;
            transfer_fee!(
                self,
                user,
                authority,
                &[],
                self.job.job_fee(timeout - self.job.timeout)
            )?;
        }
        self.job.timeout = timeout;
        Ok(())
    }
}

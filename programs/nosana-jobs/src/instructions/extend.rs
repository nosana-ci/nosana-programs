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
    pub job: Box<Account<'info, JobAccount>>,
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
        require_gt!(
            timeout,
            self.job.timeout,
            NosanaJobsError::JobTimeoutNotGreater
        );

        let duration = timeout - self.job.timeout;
        self.job.update_timeout(timeout);

        if self.job.price == 0 {
            return Ok(());
        }

        // deposit job payment and transfer network fee
        let (deposit, fee) = self.job.get_deposit_and_fee(duration);
        transfer_tokens_to_vault!(self, deposit)?;
        transfer_fee!(self, user, authority, &[], fee)
    }
}

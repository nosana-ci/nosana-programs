use crate::*;
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{Token, TokenAccount},
};

#[derive(Accounts)]
pub struct End<'info> {
    #[account(
        mut,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        constraint = job.project == authority.key() @ NosanaError::Unauthorized
    )]
    pub job: Box<Account<'info, JobAccount>>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        has_one = job @ NosanaJobsError::InvalidJobAccount,
        constraint = run.job == job.key() @ NosanaJobsError::JobInvalidRunAccount
    )]
    pub run: Account<'info, RunAccount>,
    #[account(
        mut,
        constraint = job.price == 0 || deposit.mint == id::NOS_TOKEN @ NosanaError::InvalidATA
    )]
    pub deposit: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = job.price == 0 ||
            user.key() == get_associated_token_address(&run.node, &id::NOS_TOKEN)
            @ NosanaError::InvalidATA
    )]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> End<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.job
            .end(self.run.time, Clock::get()?.unix_timestamp, self.run.node);

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

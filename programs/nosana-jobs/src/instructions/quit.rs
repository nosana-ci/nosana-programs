use crate::*;

#[derive(Accounts)]
pub struct Quit<'info> {
    #[account(mut)]
    pub job: Account<'info, JobAccount>,
    #[account(
        mut,
        close = payer,
        has_one = job @ NosanaError::InvalidJobAccount,
        has_one = payer @ NosanaError::InvalidPayer,
        constraint = run.node == authority.key() @ NosanaError::Unauthorized,
    )]
    pub run: Account<'info, RunAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    pub payer: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

impl<'info> Quit<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.job.quit()
    }
}

use crate::*;

#[derive(Accounts)]
pub struct Quit<'info> {
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        constraint = run.node == authority.key() @ NosanaError::Unauthorized,
    )]
    pub run: Account<'info, RunAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    pub payer: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(_ctx: Context<Quit>) -> Result<()> {
    Ok(())
}

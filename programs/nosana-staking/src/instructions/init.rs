use crate::*;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        init,
        payer = authority,
        space = SettingsAccount::SIZE,
        seeds = [ constants::PREFIX_SETTINGS.as_ref() ],
        bump,
    )]
    pub settings: Account<'info, SettingsAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    // get settings account and init
    ctx.accounts.settings.set(id::AUTHORITY, id::TOKEN_ACCOUNT);
    Ok(())
}

use crate::*;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(init, payer = authority, space = SETTINGS_SIZE, seeds = [ b"settings" ], bump)]
    pub settings: Account<'info, SettingsAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    // get settings account and init
    let settings: &mut Account<SettingsAccount> = &mut ctx.accounts.settings;
    settings.set(id::AUTHORITY, id::TOKEN_ACCOUNT);
    Ok(())
}

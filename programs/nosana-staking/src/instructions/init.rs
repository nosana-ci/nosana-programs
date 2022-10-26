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

impl<'info> Init<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.settings.set(id::AUTHORITY, id::TOKEN_ACCOUNT)
    }
}

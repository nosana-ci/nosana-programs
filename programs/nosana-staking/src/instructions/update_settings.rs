use crate::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct UpdateSettings<'info> {
    /// CHECK: this will be the new authority
    pub new_authority: AccountInfo<'info>,
    #[account(token::mint = id::NOS_TOKEN)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        seeds = [ constants::PREFIX_SETTINGS.as_ref() ],
        bump
    )]
    pub settings: Account<'info, SettingsAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateSettings>) -> Result<()> {
    // get settings account and update it
    ctx.accounts.settings.set(
        ctx.accounts.new_authority.key(),
        ctx.accounts.token_account.key(),
    );
    Ok(())
}

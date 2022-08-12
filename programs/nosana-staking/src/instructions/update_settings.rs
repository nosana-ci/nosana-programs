use crate::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct UpdateSettings<'info> {
    pub new_authority: Signer<'info>,
    #[account(token::mint = id::NOS_TOKEN)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized, seeds = [ b"settings" ], bump)]
    pub settings: Account<'info, SettingsAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateSettings>) -> Result<()> {
    // get settings account and update it
    let settings: &mut Account<SettingsAccount> = &mut ctx.accounts.settings;
    settings.set(
        *ctx.accounts.new_authority.key,
        *ctx.accounts.token_account.to_account_info().key,
    );
    Ok(())
}

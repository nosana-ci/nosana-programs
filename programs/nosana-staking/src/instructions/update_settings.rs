use crate::*;
use anchor_spl::token::TokenAccount;
use nosana_common::{nos, NosanaError};

#[derive(Accounts)]
pub struct UpdateSettings<'info> {
    #[account(mut, token::mint = nos::ID)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized, seeds = [ b"settings" ], bump)]
    pub settings: Account<'info, SettingsAccount>,
    pub authority: Signer<'info>,
    pub new_authority: Signer<'info>,
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

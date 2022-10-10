use crate::*;
use anchor_spl::token::{close_account, CloseAccount, Token, TokenAccount};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority @ NosanaError::Unauthorized,
        has_one = vault @ NosanaError::InvalidVault,
    )]
    pub market: Account<'info, MarketAccount>,
    // #[account(mut, constraint = vault.amount == 0 @ NosanaError::VaultNotEmpty)]
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Close>) -> Result<()> {
    // close the token vault
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.authority.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        &[&[
            ctx.accounts.market.key().as_ref(),
            id::NOS_TOKEN.as_ref(),
            &[ctx.accounts.market.vault_bump],
        ]],
    ))
}

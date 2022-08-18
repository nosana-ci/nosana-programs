use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(has_one = authority @ NosanaError::Unauthorized, seeds = [ b"settings" ], bump)]
    pub settings: Account<'info, SettingsAccount>,
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, address = settings.token_account @ NosanaError::InvalidTokenAccount)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut, address = stake.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Slash>, amount: u64) -> Result<()> {
    // get stake and vault account
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;

    // test amount
    require!(amount <= stake.amount, NosanaError::StakeAmountNotEnough);

    // slash stake
    stake.slash(amount);

    // transfer tokens to the token_account
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[&[
                b"vault".as_ref(),
                id::NOS_TOKEN.as_ref(),
                stake.authority.as_ref(),
                &[stake.vault_bump],
            ]],
        ),
        amount,
    )
}

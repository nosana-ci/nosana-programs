use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens_with_seeds, NosanaError};

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
    let vault: &mut Account<TokenAccount> = &mut ctx.accounts.vault;

    // test amount
    require!(amount <= vault.amount, NosanaError::StakeAmountNotEnough);

    // slash stake
    stake.slash(amount);

    // transfer tokens from vault to given token account
    let bump = *ctx.bumps.get("vault").unwrap();
    transfer_tokens_with_seeds(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.token_account.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        bump,
        amount,
        &[
            b"vault",
            nos::ID.key().as_ref(),
            stake.authority.key().as_ref(),
            &[bump],
        ],
    )
}

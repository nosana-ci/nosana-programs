use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens_with_seeds, NosanaError};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [ b"vault", nos::ID.key().as_ref(), stake.authority.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        seeds = [ b"stats" ],
        bump
    )]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Slash>, amount: u64) -> Result<()> {
    // get stake account
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;

    // test amount
    require!(amount <= stake.amount, NosanaError::StakeAmountNotEnough);

    // slash stake
    stake.slash(amount);

    let bump = *ctx.bumps.get("vault").unwrap();

    // transfer tokens from vault to given token account
    transfer_tokens_with_seeds(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.to.to_account_info(),
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

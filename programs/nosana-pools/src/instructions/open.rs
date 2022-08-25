use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Open<'info> {
    #[account(
        init,
        payer = authority,
        space = POOL_SIZE,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ b"vault", pool.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Open>, emmission: u64, start_time: i64, closeable: bool) -> Result<()> {
    // TODO: maybe we want to support pools already started?
    // require!(start_time >= Clock::get()?.unix_timestamp, NosanaError::PoolStartTimeInPast);

    // init pool
    (&mut ctx.accounts.pool).init(
        emmission,
        *ctx.accounts.authority.key,
        start_time,
        *ctx.accounts.vault.to_account_info().key,
        *ctx.bumps.get("vault").unwrap(),
        closeable,
    );

    Ok(())
}

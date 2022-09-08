use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Open<'info> {
    #[account(init, payer = authority, space = POOL_SIZE)]
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
    #[account(token::mint = mint)]
    pub beneficiary: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<Open>,
    emission: u64,
    start_time: i64,
    claim_type: u8,
    closeable: bool,
) -> Result<()> {
    // init pool
    (&mut ctx.accounts.pool).init(
        ctx.accounts.authority.key(),
        ctx.accounts.beneficiary.key(),
        claim_type,
        closeable,
        emission,
        start_time,
        ctx.accounts.vault.key(),
        *ctx.bumps.get("vault").unwrap(),
    );
    Ok(())
}

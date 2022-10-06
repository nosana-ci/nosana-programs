use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Open<'info> {
    #[account(init, payer = authority, space = PoolAccount::SIZE)]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ constants::PREFIX_VAULT.as_ref(), pool.key().as_ref() ],
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
    ctx.accounts.pool.init(
        ctx.accounts.authority.key(),
        ctx.accounts.beneficiary.key(),
        ClaimType::from(claim_type) as u8,
        closeable,
        emission,
        start_time,
        ctx.accounts.vault.key(),
        *ctx.bumps.get("vault").unwrap(),
    );
    Ok(())
}

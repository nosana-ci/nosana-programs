use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = MARKET_SIZE)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ market.key().as_ref(), mint.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Only the account address is needed for an access key
    pub access_key: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Init>,
    job_price: u64,
    job_timeout: i64,
    job_type: u8,
    node_stake_minimum: u64,
) -> Result<()> {
    (&mut ctx.accounts.market).init(
        ctx.accounts.authority.key(),
        job_price,
        job_timeout,
        job_type,
        ctx.accounts.access_key.key(),
        node_stake_minimum,
        ctx.accounts.vault.key(),
        *ctx.bumps.get("vault").unwrap(),
    );
    Ok(())
}

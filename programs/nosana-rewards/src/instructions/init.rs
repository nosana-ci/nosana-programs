use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        space = STATS_SIZE,
        seeds = [ constants::PREFIX_STATS.as_ref() ],
        bump
    )]
    pub stats: Account<'info, StatsAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ mint.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    // init stats account
    (&mut ctx.accounts.stats).init(ctx.accounts.vault.key(), *ctx.bumps.get("vault").unwrap());
    Ok(())
}

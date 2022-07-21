use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};
use nosana_common::nos;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitVault<'info> {
    #[account(address = nos::ID)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = ata_vault,
        seeds = [ b"nos", mint.key().as_ref() ],
        bump,
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = authority,
        space = STATS_SIZE,
        seeds = [ b"stats", mint.key().as_ref() ],
        bump,
    )]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
    // init xnos vault
    let stats = &mut ctx.accounts.stats;
    stats.init(*ctx.bumps.get("stats").unwrap());
    Ok(())
}

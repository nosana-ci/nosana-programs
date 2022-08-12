use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use nosana_common::address;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = address::NOS)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = STATS_SIZE, seeds = [ b"stats" ], bump)]
    pub stats: Box<Account<'info, StatsAccount>>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = ata_vault,
        seeds = [ address::NOS.key().as_ref() ],
        bump,
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    // init stats account
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.init(*ctx.bumps.get("stats").unwrap());

    // finish
    Ok(())
}

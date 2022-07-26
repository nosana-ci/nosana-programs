use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

use nosana_common::{nos, NosanaError};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = nos::ID)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = ata_vault,
        seeds = [ nos::ID.key().as_ref() ],
        bump,
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = authority,
        space = STATS_SIZE,
        seeds = [ b"stats" ],
        bump,
    )]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    let stats = &mut ctx.accounts.stats;
    stats.bump = *ctx.bumps.get("stats").unwrap();
    stats.r_total = 0;
    stats.t_total = 0;
    stats.rate = INITIAL_RATE;
    Ok(())
}

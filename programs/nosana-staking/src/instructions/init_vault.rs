use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use nosana_common::{authority, nos};

#[derive(Accounts)]
pub struct InitVault<'info> {
    #[account(address = nos::ID)]
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
        seeds = [ mint.key().as_ref() ],
        bump,
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
    // init stats account
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.init(*ctx.bumps.get("stats").unwrap(), authority::ID);

    // finish
    Ok(())
}

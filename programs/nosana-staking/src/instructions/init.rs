use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use nosana_common::{authority, nos, NosanaError};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = nos::ID @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = ata_vault,
        seeds = [ mint.key().as_ref() ],
        bump,
    )]
    pub ata_vault: Account<'info, TokenAccount>,
    #[account(init, payer = authority, space = STATS_SIZE, seeds = [ b"stats" ], bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Init>) -> Result<()> {
    // get stats account and init
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    stats.init(authority::ID);
    Ok(())
}

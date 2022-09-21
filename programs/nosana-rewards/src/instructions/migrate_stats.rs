use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct MigrateStats<'info> {
    pub stats: Account<'info, StatsAccount>,
    #[account(
        init,
        payer = authority,
        space = REFLECTION_SIZE,
        seeds = [ constants::PREFIX_REFLECTION.as_ref() ],
        bump
    )]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(seeds = [ id::NOS_TOKEN.as_ref() ], bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<MigrateStats>) -> Result<()> {
    // migrate stats account
    (&mut ctx.accounts.reflection).migrate(
        ctx.accounts.stats.rate,
        ctx.accounts.stats.total_reflection,
        ctx.accounts.stats.total_xnos,
        ctx.accounts.vault.key(),
        *ctx.bumps.get("vault").unwrap(),
    );
    Ok(())
}

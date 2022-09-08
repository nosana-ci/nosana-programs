use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = JOBS_SIZE)]
    pub queue: Account<'info, JobsAccount>,
    #[account(init, payer = authority, space = JOBS_SIZE)]
    pub running: Account<'info, JobsAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ queue.key().as_ref(), running.key().as_ref(), mint.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    // required
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Init>, job_size: u8) -> Result<()> {
    (&mut ctx.accounts.queue).init(job_size, JobStatus::Queued as u8, ctx.accounts.vault.key());
    (&mut ctx.accounts.running).init(job_size, JobStatus::Running as u8, ctx.accounts.vault.key());
    Ok(())
}

use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = QUEUE_SIZE)]
    pub nodes: Account<'info, NodesAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ nodes.key().as_ref(), mint.key().as_ref() ],
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

pub fn handler(ctx: Context<Init>, job_price: u64, job_timeout: i64, job_type: u8) -> Result<()> {
    (&mut ctx.accounts.nodes).init(job_price, job_timeout, job_type, ctx.accounts.vault.key());
    Ok(())
}

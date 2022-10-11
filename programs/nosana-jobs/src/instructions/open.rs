use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Open<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = MarketAccount::SIZE)]
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
    #[account(
        init_if_needed,
        payer = authority,
        space = RunAccount::SIZE,
        address = id::DUMMY_JOB @NosanaError::RunAddressInvalid,
    )]
    pub run: Account<'info, RunAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Only the account address is needed for an access key
    pub access_key: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Open>,
    job_expiration: i64,
    job_price: u64,
    job_timeout: i64,
    job_type: u8,
    node_xnos_minimum: u64,
) -> Result<()> {
    ctx.accounts.run.create_dummy();
    ctx.accounts.market.init(
        ctx.accounts.authority.key(),
        job_expiration,
        job_price,
        job_timeout,
        JobType::from(job_type) as u8,
        ctx.accounts.access_key.key(),
        node_xnos_minimum,
        ctx.accounts.vault.key(),
        *ctx.bumps.get("vault").unwrap(),
    );
    Ok(())
}
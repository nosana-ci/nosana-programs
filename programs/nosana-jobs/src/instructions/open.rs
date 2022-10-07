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
        space = JobAccount::SIZE,
        seeds = [ id::SYSTEM_PROGRAM.as_ref() ],
        bump,
    )]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
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
    node_stake_minimum: u64,
) -> Result<()> {
    ctx.accounts.market.init(
        ctx.accounts.authority.key(),
        job_expiration,
        job_price,
        job_timeout,
        JobType::from(job_type) as u8,
        ctx.accounts.access_key.key(),
        node_stake_minimum,
        ctx.accounts.vault.key(),
        *ctx.bumps.get("vault").unwrap(),
    );
    ctx.accounts.job.project = id::JOBS_PROGRAM;
    Ok(())
}

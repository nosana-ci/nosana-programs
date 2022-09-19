use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, StatsAccount};

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer = fee_payer, space = JOB_SIZE)]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub nodes: Account<'info, NodesAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub rewards_stats: Account<'info, StatsAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    pub rewards_program: Program<'info, NosanaRewards>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Create>, ipfs_job: [u8; 32]) -> Result<()> {
    // queue the job
    let job: &mut JobAccount = &mut ctx.accounts.job;
    job.create(
        ctx.accounts.authority.key(),
        ipfs_job,
        ctx.accounts.nodes.key(),
    );

    // claim the job for a node that might be queued
    let node: Pubkey = ctx.accounts.nodes.get();
    if node != id::SYSTEM_PROGRAM {
        job.claim(node, Clock::get()?.unix_timestamp);
    }

    // deposit tokens for the job
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        ctx.accounts.nodes.job_price,
    )?;

    // send fee to stakers
    nosana_rewards::cpi::add_fee(
        CpiContext::new(
            ctx.accounts.rewards_program.to_account_info(),
            AddFee {
                user: ctx.accounts.user.to_account_info(),
                stats: ctx.accounts.rewards_stats.to_account_info(),
                vault: ctx.accounts.rewards_vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        ctx.accounts.nodes.job_price / JOB_FEE_FRACTION,
    )
}

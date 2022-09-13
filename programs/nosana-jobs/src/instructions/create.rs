use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer = fee_payer, space = JOB_SIZE)]
    pub job: Account<'info, JobAccount>,
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub nodes: Account<'info, NodesAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Create>, ipfs_job: [u8; 32]) -> Result<()> {
    // create empty job
    let job: &mut JobAccount = &mut ctx.accounts.job;
    job.create(
        ctx.accounts.authority.key(),
        ipfs_job,
        ctx.accounts.nodes.job_price,
    );

    // there might be a node ready to claim this job immediately
    let node: Pubkey = ctx.accounts.nodes.get();
    if node != id::SYSTEM_PROGRAM {
        job.claim(Clock::get()?.unix_timestamp, node);
    }

    // deposit tokens
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        job.tokens,
    )
}

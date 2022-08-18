use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct FinishJob<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = job.node == authority.key() @ NosanaError::Unauthorized,
        constraint = job.job_status == JobStatus::Claimed as u8 @ NosanaError::JobNotClaimed,
    )]
    pub job: Account<'info, Job>,
    #[account(mut, seeds = [ id::TST_TOKEN.as_ref() ], bump)]
    pub vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<FinishJob>, data: [u8; 32]) -> Result<()> {
    // get job and finish it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.finish(Clock::get()?.unix_timestamp, data);

    // payout tokens
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[&[id::TST_TOKEN.as_ref(), &[*ctx.bumps.get("vault").unwrap()]]],
        ),
        job.tokens,
    )
}

use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct CancelJob<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub jobs: Account<'info, Jobs>,
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Initialized as u8 @ NosanaError::JobNotInitialized
    )]
    pub job: Account<'info, Job>,
    #[account(mut, seeds = [ id::TST_TOKEN.as_ref() ], bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelJob>) -> Result<()> {
    // get job and cancel it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.cancel();

    let amount = job.tokens;
    // get jobs, check signature with authority, remove job from jobs list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    jobs.remove_job(&ctx.accounts.job.key())?;

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
        amount,
    )
}

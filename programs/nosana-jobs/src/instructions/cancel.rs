use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub project: Account<'info, ProjectAccount>,
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Initialized as u8 @ NosanaError::JobNotInitialized
    )]
    pub job: Account<'info, JobAccount>,
    #[account(mut, seeds = [ id::TST_TOKEN.as_ref() ], bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Cancel>) -> Result<()> {
    // get job and cancel it
    let job: &mut Account<JobAccount> = &mut ctx.accounts.job;
    job.cancel();

    // get project and remove job from jobs list
    (&mut ctx.accounts.project).remove_job(&job.key())?;

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

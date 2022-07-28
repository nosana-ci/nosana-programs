use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct CancelJob<'info> {
    #[account(mut, owner = ID.key())]
    pub jobs: Account<'info, Jobs>,
    #[account(mut, owner = ID.key())]
    pub job: Account<'info, Job>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelJob>) -> Result<()> {
    // get job and cancel it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Initialized as u8,
        NosanaError::JobNotInitialized
    );
    job.cancel();

    // refund tokens
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        job.tokens,
    )?;

    // get jobs, check signature with authority, remove job from jobs list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    require!(
        jobs.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    return jobs.remove_job(ctx.accounts.job.to_account_info().key);
}

use crate::*;

use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CancelJob<'info> {
    #[account(mut)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(mut, seeds = [ mint::ID.as_ref() ], bump = bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelJob>, bump: u8) -> Result<()> {
    // get job
    let job: &mut Account<Job> = &mut ctx.accounts.job;

    // check status of job
    require!(
        job.job_status == JobStatus::Created as u8,
        NosanaError::NotCancelable
    );

    // update and finish job account, remove job from jobs list
    job.cancel();

    // refund tokens to authority
    nos_spl::transfer_sign(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        bump,
        job.tokens,
    )?;

    // get jobs
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;

    // check signature with authority
    require!(
        jobs.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );

    // get jobs
    return jobs.remove_job(ctx.accounts.job.to_account_info().key);
}

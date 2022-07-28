use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct FinishJob<'info> {
    #[account(mut, owner = ID.key())]
    pub job: Account<'info, Job>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<FinishJob>, data: [u8; 32]) -> Result<()> {
    // get job, verify signature and status, before finishing
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.node == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(
        job.job_status == JobStatus::Claimed as u8,
        NosanaError::JobNotClaimed
    );
    job.finish(ctx.accounts.clock.unix_timestamp, data);

    //  pay out
    return transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        job.tokens,
    );
}

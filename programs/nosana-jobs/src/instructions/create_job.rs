use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct CreateJob<'info> {
    #[account(init, payer = fee_payer, space = JOB_SIZE)]
    pub job: Account<'info, Job>,
    #[account(mut, owner = ID.key())]
    pub jobs: Account<'info, Jobs>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateJob>, amount: u64, data: [u8; 32]) -> Result<()> {
    // retrieve job list and check signature
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    require!(
        jobs.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );

    // create job
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.create(ctx.accounts.authority.key(), data, amount);

    // transfer tokens
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // skip signature
        job.tokens,
    )?;

    // we push the account of the job to the list
    jobs.add_job(ctx.accounts.job.key());

    // finish
    Ok(())
}

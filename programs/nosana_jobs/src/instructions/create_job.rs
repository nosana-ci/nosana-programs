use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateJob<'info> {
    #[account(mut)]
    pub jobs: Account<'info, Jobs>,

    #[account(init, payer = fee_payer, space = JOB_SIZE)]
    pub job: Account<'info, Job>,

    #[account(address = mint::ID)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut, seeds = [ mint.key().as_ref() ], bump = bump)]
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
    // retrieve job list from account
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;

    require!(
        jobs.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );

    // create the job
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.create(data, amount);

    // pre-pay for job
    utils::transfer_tokens(
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

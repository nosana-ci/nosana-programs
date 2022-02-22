use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateJob<'info> {

    #[account(mut, has_one = authority)]
    pub jobs: Account<'info, Jobs>,
    pub authority: Signer<'info>,

    #[account(init, payer = authority, space = 48)] // TODO: make space size of Job
    pub job: Account<'info, Job>,

    #[account(address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap())]
    pub nos: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ nos.key().as_ref() ],
        bump = bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,


    #[account(mut)]
    pub nos_from: Box<Account<'info, TokenAccount>>,

    /// required
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateJob>, _bump: u8, amount: u64) -> ProgramResult {

    // retrieve job list from account
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;

    let job : &mut Account<Job> = &mut ctx.accounts.job;
    job.job_status = JobStatus::Created as u8;
    job.ipfs_link = 1; // TODO: make ipfs link
    job.tokens = amount;

    // pre-pay for job
    token::transfer(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.nos_from.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    ), amount)?;

    // we push the account of the job to the list
    jobs.jobs.push(ctx.accounts.job.key());

    // reload
    (&mut ctx.accounts.vault).reload()?;

    // finish
    Ok(())
}

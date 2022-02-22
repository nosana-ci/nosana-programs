use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateJob<'info> {

    pub authority: Signer<'info>,

    #[account(address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap())]
    pub nos: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ nos.key().as_ref() ],
        bump = bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, has_one = authority)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub nos_from: Box<Account<'info, TokenAccount>>,

    /// required
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CreateJob>, bump: u8, amount: u64) -> ProgramResult {

    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;

    let job : Job = Job::new(JobStatus::Created, 1, amount);


    // pay for job
    token::transfer(ctx_create_job(ctx.accounts), amount)?;


    // reload
    (&mut ctx.accounts.vault).reload()?;

    // finish
    Ok(())
}

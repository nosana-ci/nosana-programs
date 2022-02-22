use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateJob<'info> {

    #[account(mut, has_one = authority)]
    pub jobs: Account<'info, Jobs>,
    pub authority: Signer<'info>,

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
}

pub fn handler(ctx: Context<CreateJob>, bump: u8, amount: u64) -> ProgramResult {

    // retrieve job list from account
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;

    // create Job struct to add to the list
    let job : Job = Job::new(JobStatus::Created, 1, amount);

    // pre-pay for job
    token::transfer(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.nos_from.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    ), amount)?;


    // For now just push a number, TODO: this should be 'job' , update state
    jobs.jobs.push(0);

    // reload
    (&mut ctx.accounts.vault).reload()?;

    // finish
    Ok(())
}

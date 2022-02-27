use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct FinishJob<'info> {

    #[account(mut)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(address = TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap())]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut, seeds = [ mint.key().as_ref() ], bump = bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<FinishJob>, bump: u8, data: [u8; 32]) -> ProgramResult {

    // get job
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    let job: &mut Account<Job> = &mut ctx.accounts.job;

    // check signature with node
    if &job.node != ctx.accounts.authority.key {
        return Err(ErrorCode::Unauthorized.into());
    }

    // update and finish job account
    job.job_status = JobStatus::Finished as u8;
    job.ipfs_result = data;

    //transfer from vault to node
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.ata_vault.to_account_info(),
                to: ctx.accounts.ata_to.to_account_info(),
                authority: ctx.accounts.ata_vault.to_account_info(),
            },
            &[&[ctx.accounts.mint.to_account_info().key.as_ref(), &[bump]]]
        ),
        job.tokens
    )?;

    // remove job from jobs list
    let job_key: &mut Pubkey =  &mut ctx.accounts.job.key();
    let index: usize = jobs.jobs.iter_mut().position(| key: &mut Pubkey | key == job_key).unwrap();
    jobs.jobs.remove(index);

    // finish
    Ok(())
}

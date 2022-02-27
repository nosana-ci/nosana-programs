use crate::*;

use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct FinishJob<'info> {

    #[account(mut)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(address = mint::ID)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut, seeds = [ mint.key().as_ref() ], bump = bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<FinishJob>, bump: u8, data: [u8; 32]) -> Result<()> {

    // get job
    let job: &mut Account<Job> = &mut ctx.accounts.job;

    // check signature with node, and status of job
    require!(job.node == *ctx.accounts.authority.key, NosanaError::Unauthorized);
    require!(job.job_status == JobStatus::Claimed as u8, NosanaError::NotFinishable);

    // update and finish job account, remove job from jobs list
    job.job_status = JobStatus::Finished as u8;
    job.ipfs_result = data;

    // payout tokens from the vault to node
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

    // get jobs
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;

    //  find job in queue
    let job_key: &Pubkey = ctx.accounts.job.to_account_info().key;
    let index: Option<usize> = jobs.jobs.iter().position(| key: &Pubkey | key == job_key);

    // check if job is found
    require!(!index.is_none(), NosanaError::JobQueueNotFound);

    // remove job from jobs list
    jobs.jobs.remove(index.unwrap());

    // finish
    Ok(())
}

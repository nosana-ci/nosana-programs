use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct FinishJob<'info> {

    #[account(mut)]
    pub authority: Signer<'info>,
    pub project: AccountInfo<'info>,

    #[account(mut, has_one = project)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(
        mut,
        seeds = [ nos.key().as_ref() ],
        bump = bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap())]
    pub nos: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub node: Box<Account<'info, TokenAccount>>,

    /// required
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<FinishJob>, bump: u8) -> ProgramResult {

    // get job
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    let job : &mut Account<Job> = &mut ctx.accounts.job;

    // check signature with node
    if &job.node != ctx.accounts.authority.key {
        return Err(ErrorCode::Unauthorized.into());
    }

    // finish job
    job.job_status = JobStatus::Finished as u8;
    job.ipfs_result = 1;

    // sign with the vault
    let token_mint_key = ctx.accounts.nos.key();
    let seeds = &[token_mint_key.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    //transfer from vault to node
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.node.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, job.tokens)?;

    // remove job from queue
    let job_key: &mut Pubkey =  &mut ctx.accounts.job.key();
    let index = jobs.jobs.iter_mut().position(|x| x == job_key).unwrap();
    jobs.jobs.remove(index);

    //  reload balances
    (&mut ctx.accounts.vault).reload()?;

    // finish
    Ok(())
}

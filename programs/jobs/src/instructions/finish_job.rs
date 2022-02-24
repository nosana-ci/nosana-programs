use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct FinishJob<'info> {

    #[account(mut)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap())]
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
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    let job : &mut Account<Job> = &mut ctx.accounts.job;

    // check signature with node
    if &job.node != ctx.accounts.authority.key {
        return Err(ErrorCode::Unauthorized.into());
    }

    // finish job
    job.job_status = JobStatus::Finished as u8;
    job.ipfs_result = data;

    // sign with the vault
    let token_mint_key = ctx.accounts.mint.key();
    let seeds = &[token_mint_key.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    //transfer from vault to node
    let cpi_ctx: CpiContext<Transfer> = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.ata_vault.to_account_info(),
            to: ctx.accounts.ata_to.to_account_info(),
            authority: ctx.accounts.ata_vault.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, job.tokens)?;

    // remove job from queue
    let job_key: &mut Pubkey =  &mut ctx.accounts.job.key();
    let index: usize = jobs.jobs.iter_mut().position(|key: &mut Pubkey | key == job_key).unwrap();
    jobs.jobs.remove(index);

    //  reload balances
    (&mut ctx.accounts.ata_vault).reload()?;

    // finish
    Ok(())
}

use crate::*;

use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct FinishJob<'info> {
    #[account(mut)]
    pub job: Account<'info, Job>,

    #[account(mut, seeds = [ mint::ID.as_ref() ], bump = bump)]
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
    require!(
        job.node == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(
        job.job_status == JobStatus::Claimed as u8,
        NosanaError::NotFinishable
    );

    // update and finish job account, remove job from jobs list
    job.finish(data);

    //  pay out
    return utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        bump,
        job.tokens,
    );
}

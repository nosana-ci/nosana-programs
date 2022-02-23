use crate::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct FinishJob<'info> {

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub job: Account<'info, Job>,

    /// required
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FinishJob>, _bump: u8) -> ProgramResult {

    // set claimed
    let job = &mut ctx.accounts.job;
    job.job_status = JobStatus::Finished as u8;

    // finish
    Ok(())
}

use crate::*;

#[derive(Accounts)]
pub struct ClaimJob<'info> {

    #[account(mut)]
    pub job: Account<'info, Job>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimJob>) -> ProgramResult {

    // set claimed
    let job = &mut ctx.accounts.job;
    job.job_status = JobStatus::Claimed as u8;
    job.node = *ctx.accounts.authority.key;

    // finish
    Ok(())
}

use crate::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct GetJob<'info> {

    #[account(mut)]
    pub job: Account<'info, Job>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<GetJob>) -> ProgramResult {
    // let job : &mut Account<Job> = &mut ctx.accounts.job;
    // emit!(JobInfo {
    //     jobs: jobs.jobs
    // });
    Ok(())
}

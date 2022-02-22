use crate::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct ListJobs<'info> {

    #[account(mut, has_one = authority)]
    pub jobs: Account<'info, Jobs>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ListJobs>) -> ProgramResult {
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    // emit!(JobList {
    //     jobs: jobs.jobs
    // });
    Ok(())
}

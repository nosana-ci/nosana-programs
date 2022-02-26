use crate::*;

#[derive(Accounts)]
pub struct InitProject<'info> {

    #[account(init, payer = fee_payer, space = JOBS_SIZE)]
    pub jobs: Account<'info, Jobs>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitProject>) -> ProgramResult {
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    jobs.authority = *ctx.accounts.authority.key;
    jobs.jobs = Vec::new();
    Ok(())
}

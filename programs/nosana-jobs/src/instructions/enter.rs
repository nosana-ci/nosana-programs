use crate::*;

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(init, payer = fee_payer, space = JOBS_SIZE)]
    pub jobs: Account<'info, ProjectAccount>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Enter>) -> Result<()> {
    let jobs: &mut Account<ProjectAccount> = &mut ctx.accounts.jobs;
    jobs.init(*ctx.accounts.authority.key);
    Ok(())
}

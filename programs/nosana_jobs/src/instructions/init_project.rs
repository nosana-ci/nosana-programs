use crate::*;

#[derive(Accounts)]
pub struct InitProject<'info> {
    #[account(init, payer = fee_payer, space = JOBS_SIZE)]
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub fee_payer: Signer<'info>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitProject>) -> Result<()> {
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    jobs.init(*ctx.accounts.authority.key);
    Ok(())
}

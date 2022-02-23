use crate::*;

#[derive(Accounts)]
pub struct InitProject<'info> {

    pub project: Signer<'info>,

    #[account(init, payer = project, space = 4800)] // TODO make space size of pubkey list
    pub jobs: Account<'info, Jobs>,

    /// required
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitProject>) -> ProgramResult {
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    jobs.project = *ctx.accounts.project.key;
    jobs.jobs = Vec::new();
    Ok(())
}

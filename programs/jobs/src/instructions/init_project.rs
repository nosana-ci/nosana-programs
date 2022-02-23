use crate::*;

#[derive(Accounts)]
pub struct InitializeProject<'info> {

    pub authority: Signer<'info>,

    #[account(init, payer = authority, space = 4800)] // TODO make space size of pubkey list
    pub jobs: Account<'info, Jobs>,

    /// required
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeProject>) -> ProgramResult {
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    jobs.authority = *ctx.accounts.authority.key;
    jobs.jobs = Vec::new();
    Ok(())
}

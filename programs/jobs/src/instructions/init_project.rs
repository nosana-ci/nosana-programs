use crate::*;

#[derive(Accounts)]
pub struct InitProject<'info> {

    #[account(init, payer = authority, space = 4800)] // TODO make space size of pubkey list
    pub jobs: Account<'info, Jobs>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitProject>) -> ProgramResult {
    let jobs : &mut Account<Jobs> = &mut ctx.accounts.jobs;
    jobs.authority = *ctx.accounts.authority.key;
    jobs.jobs = Vec::new();
    Ok(())
}

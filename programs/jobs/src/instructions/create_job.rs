use crate::*;

pub fn handler(ctx: Context<Projects>, bump: u8, amount: u64) -> ProgramResult {

    // pay for job
    token::transfer(ctx_create_job(ctx.accounts), amount)?;

    // reload
    (&mut ctx.accounts.vault).reload()?;

    // finish
    Ok(())
}

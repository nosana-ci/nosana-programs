use crate::*;

pub fn handler(ctx: Context<Job>, bump: u8, amount: u64) -> ProgramResult {
    let tokens : u64 = ctx.accounts.vault.amount;

    // stake tokens and assign rewards
    token::transfer(ctx_create_job(ctx.accounts), amount)?;

    // reload
    (&mut ctx.accounts.vault).reload()?;

    Ok(())
}

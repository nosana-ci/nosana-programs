use crate::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);

    // clock time for unstake
    stake.unstake(ctx.accounts.clock.unix_timestamp);

    // finish
    Ok(())
}

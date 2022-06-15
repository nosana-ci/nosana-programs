use crate::*;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(stake.time_unstake != 0, NosanaError::StakeAlreadyStaked);

    // NULL time for unstake
    stake.unstake(0);

    // finish
    Ok(())
}

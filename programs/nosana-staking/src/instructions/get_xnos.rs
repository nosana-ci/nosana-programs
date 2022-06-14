use crate::*;

#[derive(Accounts)]
pub struct GetXnos<'info> {
    #[account()]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<GetXnos>) -> Result<()> {
    let stake = &ctx.accounts.stake;

    // clock time for unstake
    utils::get_xnos(
        ctx.accounts.clock.unix_timestamp,
        stake.time,
        stake.amount,
        stake.duration,
    );

    // finish
    Ok(())
}

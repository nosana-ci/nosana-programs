use crate::*;

#[derive(Accounts)]
pub struct EmitRank<'info> {
    #[account()]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<EmitRank>) -> Result<()> {
    let stake = &ctx.accounts.stake;

    // determine xnos and emit it
    let xnos = utils::calculate_xnos(
        ctx.accounts.clock.unix_timestamp,
        stake.time_unstake,
        stake.amount,
        stake.duration,
    );

    // emit rank
    emit!(Rank { xnos });

    // finish
    Ok(())
}

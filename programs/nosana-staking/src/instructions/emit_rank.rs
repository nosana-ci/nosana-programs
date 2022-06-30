use crate::*;

#[derive(Accounts)]
pub struct EmitRank<'info> {
    pub stake: Account<'info, StakeAccount>,
    pub clock: Sysvar<'info, Clock>,
}

#[event]
pub struct Rank {
    pub xnos: u128,
    pub time_unstake: i64,
    pub duration: u128,
    pub amount: u64,
}

pub fn handler(ctx: Context<EmitRank>) -> Result<()> {
    let stake = &ctx.accounts.stake;

    // emit rank
    emit!(Rank {
        xnos: utils::calculate_xnos(
            ctx.accounts.clock.unix_timestamp,
            stake.time_unstake,
            stake.amount,
            stake.duration,
        ),
        time_unstake: stake.time_unstake,
        duration: stake.duration,
        amount: stake.amount,
    });

    // finish
    Ok(())
}

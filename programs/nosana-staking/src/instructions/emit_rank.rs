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

    // determine xnos and tier
    let xnos = utils::calculate_xnos(
        ctx.accounts.clock.unix_timestamp,
        stake.time_unstake,
        stake.amount,
        stake.duration,
    );
    let tier = utils::get_tier(xnos) as u8;

    // emit rank
    emit!(Rank { xnos, tier });

    // finish
    Ok(())
}

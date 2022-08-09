use crate::*;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        owner = staking::ID,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = staking::ID)]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    // get stake and stats
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // update stake and stats
    stats.sub(stake.xnos);
    stake.unstake(ctx.accounts.clock.unix_timestamp);

    // finish
    Ok(())
}

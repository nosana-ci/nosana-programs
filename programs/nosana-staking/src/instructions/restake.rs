use crate::*;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        owner = staking::ID,
        has_one = authority,
        constraint = stake.time_unstake != 0 @ NosanaError::StakeAlreadyStaked
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = staking::ID)]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    // get stake and stats
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // update stats and stake
    stake.unstake(0);
    stats.add(stake.xnos);

    // finish
    Ok(())
}

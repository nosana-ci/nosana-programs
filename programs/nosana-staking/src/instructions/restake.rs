use crate::*;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(mut, has_one = authority)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    // get and check the stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(stake.time_unstake != 0, NosanaError::StakeAlreadyStaked);

    // reset the unstake clock
    stake.unstake(0_i64);

    // update stats and stake
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.add(stake.xnos);

    // finish
    Ok(())
}

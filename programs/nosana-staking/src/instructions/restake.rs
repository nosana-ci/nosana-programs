use crate::*;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        owner = staking::ID @ NosanaError::WrongOwner,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaError::StakeAlreadyStaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = staking::ID @ NosanaError::WrongOwner)]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    // get stake and stats
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // update stake and stats
    stake.unstake(0);
    stats.add(stake.xnos);

    // finish
    Ok(())
}

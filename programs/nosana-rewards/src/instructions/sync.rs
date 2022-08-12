use crate::*;
use nosana_common::{address, error::NosanaError};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(owner = address::STAKING)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = address::REWARDS, constraint = stake.authority == reward.authority)]
    pub reward: Account<'info, RewardAccount>,
}

pub fn handler(ctx: Context<Sync>) -> Result<()> {
    // get and check stake + reward account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);

    // decrease the reflection pool
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    // re-enter the pool with the current stake
    let amount: u128 = u128::from(reward.get_amount(stats.rate));
    reward.update(stats.add_rewards_account(stake.xnos, amount), stake.xnos);

    // finish
    Ok(())
}

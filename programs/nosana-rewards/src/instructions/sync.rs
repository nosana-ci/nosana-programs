use crate::*;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut)]
    pub reward: Account<'info, RewardAccount>,
    #[account(
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
        constraint = stake.authority == reward.authority @ NosanaError::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
}

pub fn handler(ctx: Context<Sync>) -> Result<()> {
    // get and check stake + reward account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // decrease the reflection pool
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    // re-enter the pool with the current stake
    let amount: u128 = reward.get_amount(stats.rate);
    reward.update(stats.add_rewards_account(stake.xnos, amount), stake.xnos);

    // finish
    Ok(())
}

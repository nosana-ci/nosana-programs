use crate::*;
use nosana_common::{nos, staking, reward, NosanaError};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(owner = staking::ID)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = reward::ID)]
    pub reward: Box<Account<'info, RewardAccount>>
}

pub fn handler(ctx: Context<Sync>) -> Result<()> {
    // get and check stake + reward account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Box<Account<RewardAccount>> = &mut ctx.accounts.reward;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);
    require!(
        stake.authority == reward.authority,
        NosanaError::Unauthorized
    );
    // determine current pending pay-out
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    let amount: u128 = reward
        .reflection
        .checked_div(stats.rate)
        .unwrap()
        .checked_sub(reward.xnos)
        .unwrap();

    // decrease the reflection pool
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    // re-enter the pool with the current
    reward.update(stats.add_rewards_account(stake.xnos, amount), stake.xnos);

    // finish
    Ok(())
}

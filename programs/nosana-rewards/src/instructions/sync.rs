use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, staking, transfer_tokens, NosanaError};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(owner = staking::ID, has_one=authority)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"reward", authority.key().as_ref() ], bump = reward.bump)]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Account<'info>
}

pub fn handler(ctx: Context<Sync>) -> Result<()> {
    // get and check stake + reward account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Box<Account<RewardAccount>> = &mut ctx.accounts.reward;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);

    // determine pay-out
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

use crate::*;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, close = authority, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(has_one = authority @ NosanaError::Unauthorized)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Close>) -> Result<()> {
    // update stats
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    /*
        TODO:
           - make sure stake accounts can only be closed when rewards are closed
           - what to do when people have extra rewards pending?
    */

    // finish
    Ok(())
}

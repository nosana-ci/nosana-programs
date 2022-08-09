use crate::*;
use nosana_common::{staking, NosanaError};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut, owner = rewards::ID @ NosanaError::InvalidOwner)]
    pub stats: Account<'info, StatsAccount>,
    #[account(
        owner = staking::ID @ NosanaError::InvalidOwner,
        has_one = authority @ NosanaError::Unauthorized
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        init,
        payer = authority,
        space = REWARD_SIZE,
        seeds = [ b"reward", authority.key().as_ref()],
        bump,
    )]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Enter>) -> Result<()> {
    // get and check stake
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);

    // init the new reward account, and add reward to stats
    let reward: &mut Box<Account<RewardAccount>> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    reward.init(
        *ctx.accounts.authority.key,
        *ctx.bumps.get("reward").unwrap(),
        stats.add_rewards_account(stake.xnos, 0),
        stake.xnos,
    );

    // finish
    Ok(())
}

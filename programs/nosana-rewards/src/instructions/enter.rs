use crate::*;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut)]
    pub stats: Account<'info, StatsAccount>,
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        init,
        payer = authority,
        space = REWARD_SIZE,
        seeds = [ b"reward", authority.key().as_ref() ],
        bump,
    )]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Enter>) -> Result<()> {
    // get stake, reward, and stats account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // initialize the reward account
    reward.init(
        *ctx.accounts.authority.key,
        *ctx.bumps.get("reward").unwrap(),
        stats.add_rewards_account(stake.xnos, 0),
        stake.xnos,
    );

    // finish
    Ok(())
}

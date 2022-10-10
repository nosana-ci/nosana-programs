use crate::*;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        init,
        payer = authority,
        space = RewardAccount::SIZE,
        seeds = [ constants::PREFIX_REWARDS.as_ref(), authority.key().as_ref() ],
        bump,
    )]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Enter>) -> Result<()> {
    // get stake, reward, and stats account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reflection: &mut Account<ReflectionAccount> = &mut ctx.accounts.reflection;

    // initialize the reward account
    ctx.accounts.reward.init(
        ctx.accounts.authority.key(),
        *ctx.bumps.get("reward").unwrap(),
        reflection.add_rewards_account(stake.xnos, 0),
        stake.xnos,
    );
    Ok(())
}

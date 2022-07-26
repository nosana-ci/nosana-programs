use crate::*;

use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut, owner=ID.key(), seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(owner = staking_program.key())]
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
    pub staking_program: Program<'info, NosanaStaking>,
}


pub fn handler(ctx: Context<Enter>) -> Result<()> {
    let stake = &ctx.accounts.stake;
    let stats = &mut ctx.accounts.stats;

    let reward = &mut ctx.accounts.reward;
    reward.bump = *ctx.bumps.get("reward").unwrap();
    reward.authority = *ctx.accounts.authority.key;

    require!(stake.time_unstake == 0, NosanaError::AlreadyUnstaked);

    let tnos: u128 = u128::from(stake.xnos);
    let rnos: u128 = stats.tokens_to_reflection(tnos);

    stats.r_total = stats.r_total.checked_add(rnos).unwrap();
    stats.t_total = stats.t_total.checked_add(tnos).unwrap();
    stats.update_rate();

    reward.t_owned = tnos;
    reward.r_owned = rnos;

    Ok(())
}

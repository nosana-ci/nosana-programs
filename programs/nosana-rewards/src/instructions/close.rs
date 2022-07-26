use crate::*;

use nosana_staking::program::NosanaStaking;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, close = authority, seeds = [ b"reward", authority.key().as_ref()], bump = reward.bump)]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub staking_program: Program<'info, NosanaStaking>,
}

pub fn handler(ctx: Context<Close>) -> Result<()> {
    let stats = &mut ctx.accounts.stats;
    let reward = &mut ctx.accounts.reward;

    stats.r_total = stats.r_total.checked_sub(reward.r_owned).unwrap();
    stats.t_total = stats.t_total.checked_sub(reward.t_owned).unwrap();
    stats.update_rate();

    Ok(())
}

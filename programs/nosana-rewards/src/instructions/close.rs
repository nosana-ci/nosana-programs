use crate::*;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, close = authority, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Close>) -> Result<()> {
    // decrease the reflection pool
    (&mut ctx.accounts.stats)
        .remove_rewards_account(ctx.accounts.reward.reflection, ctx.accounts.reward.xnos);
    Ok(())
}

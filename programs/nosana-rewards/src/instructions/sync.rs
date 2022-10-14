use crate::*;
use nosana_staking::{NosanaStakingError, StakeAccount};

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut)]
    pub reward: Account<'info, RewardAccount>,
    #[account(
        constraint = stake.time_unstake == 0 @ NosanaStakingError::AlreadyUnstaked,
        constraint = stake.authority == reward.authority @ NosanaError::Unauthorized,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
}

impl<'info> Sync<'info> {
    pub fn handler(&mut self) -> Result<()> {
        // decrease the reflection pool
        self.reflection
            .remove_rewards_account(self.reward.reflection, self.reward.xnos)?;

        // re-enter the pool with the current stake
        let amount: u128 = self.reward.get_amount(self.reflection.rate);
        self.reward.update(
            self.reflection.add_rewards_account(self.stake.xnos, amount),
            self.stake.xnos,
        )
    }
}

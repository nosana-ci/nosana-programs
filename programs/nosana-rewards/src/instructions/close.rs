use crate::*;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(mut, close = authority, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Close<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.reflection
            .remove_rewards_account(self.reward.reflection, self.reward.xnos)
    }
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_staking::{NosanaStakingError, StakeAccount};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaStakingError::AlreadyUnstaked,
        constraint = stake.xnos >= reward.xnos @ NosanaStakingError::Decreased,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn handler(&mut self) -> Result<()> {
        // determine amount to claim
        let amount: u128 = self.reward.get_amount(self.reflection.rate);
        if amount == 0 {
            return Ok(());
        }

        // decrease the reflection pool
        self.reflection
            .remove_rewards_account(self.reward.reflection, self.reward.xnos + amount)?;

        // re-enter the pool with the current stake
        self.reward.update(
            self.reflection.add_rewards_account(self.stake.xnos, 0),
            self.stake.xnos,
        )?;

        // pay-out pending reward
        transfer_tokens_from_vault!(
            self,
            user,
            seeds!(self.reflection, self.vault),
            amount.try_into().unwrap()
        )
    }
}

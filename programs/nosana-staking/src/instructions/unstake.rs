use crate::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    /// CHECK: we only want to verify this account does not exist
    #[account(
        address = pda::nosana_rewards(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        constraint = utils::account_is_closed(&reward) @ NosanaError::StakeHasReward,
    )]
    pub reward: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

impl<'info> Unstake<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.stake.unstake(Clock::get()?.unix_timestamp)
    }
}

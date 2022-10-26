use crate::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaStakingError::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    /// CHECK: we only want to verify this account does not exist
    #[account(
        address = pda::nosana_rewards(authority.key) @ NosanaError::InvalidAccount,
        constraint = utils::account_is_closed(&reward) @ NosanaStakingError::HasReward,
    )]
    pub reward: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

impl<'info> Unstake<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.stake.unstake(Clock::get()?.unix_timestamp)
    }
}

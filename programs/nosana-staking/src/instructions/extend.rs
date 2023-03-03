use crate::*;

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaStakingError::AlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Extend<'info> {
    pub fn handler(&mut self, duration: u64) -> Result<()> {
        // test duration
        require_gt!(duration, 0, NosanaStakingError::DurationTooShort);

        // test new duration
        require_gte!(
            StakeAccount::DURATION_MAX,
            u128::from(self.stake.duration + duration),
            NosanaStakingError::DurationTooLong
        );

        // extend stake
        self.stake.extend(duration)
    }
}

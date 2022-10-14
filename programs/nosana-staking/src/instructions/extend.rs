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
        require!(duration > 0, NosanaStakingError::DurationTooShort);

        // test new duration
        require!(
            self.stake.duration + duration <= u64::try_from(DURATION_MAX).unwrap(),
            NosanaStakingError::DurationTooLong
        );

        // extend stake
        self.stake.extend(duration)
    }
}

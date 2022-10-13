use crate::*;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaError::StakeAlreadyStaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Restake<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.stake.unstake(0)
    }
}

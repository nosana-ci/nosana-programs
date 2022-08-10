use crate::*;
use nosana_common::NosanaError;

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

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    // get stake account and restake stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    stake.unstake(0);
    Ok(())
}

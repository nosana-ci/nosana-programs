use crate::*;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    // get stake account, and unstake stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let clock = Clock::get()?;
    stake.unstake(clock.unix_timestamp);
    Ok(())
}

use crate::*;
use anchor_spl::token::Token;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Extend>, duration: u64) -> Result<()> {
    // test duration
    require!(duration > 0, NosanaError::StakeDurationTooShort);

    // get stake account
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;

    // test new duration
    require!(
        stake.duration + duration <= u64::try_from(DURATION_MAX).unwrap(),
        NosanaError::StakeDurationTooLong
    );

    // extend stake
    stake.extend(duration);

    Ok(())
}

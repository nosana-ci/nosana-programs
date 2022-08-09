use crate::*;
use anchor_spl::token::Token;
use nosana_common::NosanaError;

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        owner = staking::ID @ NosanaError::InvalidOwner,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = staking::ID @ NosanaError::InvalidOwner)]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Extend>, duration: u64) -> Result<()> {
    // test duration
    require!(duration > 0, NosanaError::StakeDurationTooShort);

    // get stake and stats
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // update stake and stats
    stats.sub(stake.xnos);
    stake.extend(duration);
    stats.add(stake.xnos);

    // verify new duration is conform minimum and maximum allowed time
    require!(
        u128::from(stake.duration) >= constants::DURATION_MONTH,
        NosanaError::StakeDurationTooShort
    );
    require!(
        u128::from(stake.duration) <= constants::DURATION_YEAR,
        NosanaError::StakeDurationTooLong
    );

    // finish
    Ok(())
}

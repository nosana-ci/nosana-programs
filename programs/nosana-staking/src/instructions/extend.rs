use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, NosanaError};

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [ b"stake", nos::ID.key().as_ref(), authority.key().as_ref() ],
        bump = stake.bump
    )]
    pub stake: Box<Account<'info, StakeAccount>>,
    #[account(mut, seeds = [ b"stats", nos::ID.key().as_ref() ], bump = stats.bump)]
    pub stats: Box<Account<'info, StatsAccount>>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Extend>, duration: u64) -> Result<()> {
    // get and check the stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);
    require!(duration > 0, NosanaError::StakeDurationTooShort);

    // update stats and stake
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
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

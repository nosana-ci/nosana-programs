use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, NosanaError};

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(
        mut,
        seeds = [ b"stake", nos::ID.key().as_ref(), authority.key().as_ref() ],
        bump = stake.bump
    )]
    pub stake: Box<Account<'info, StakeAccount>>,
    #[account(mut, seeds = [ b"stats", nos::ID.key().as_ref() ], bump = stats.bump)]
    pub stats: Box<Account<'info, StatsAccount>>,
    #[account(mut, seeds = [ b"nos", nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Topup>, duration: u64) -> Result<()> {
    // get and check stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(
        stake.time_unstake == 0_i64,
        NosanaError::StakeAlreadyUnstaked
    );
    require!(duration > 0_u64, NosanaError::StakeDurationTooShort);

    // update stats
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.sub(utils::calculate_xnos(0, 0, stake.amount, stake.duration));
    stake.extend(duration);
    stats.add(utils::calculate_xnos(0, 0, stake.amount, stake.duration));

    // verify new duration is conform minimum and maximum allowed time
    require!(
        stake.duration >= constants::DURATION_MONTH,
        NosanaError::StakeDurationTooShort
    );
    require!(
        stake.duration <= constants::DURATION_YEAR,
        NosanaError::StakeDurationTooLong
    );

    // finish
    Ok(())
}

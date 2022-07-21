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

pub fn handler(ctx: Context<Topup>, duration: u128) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );

    let old_xnos = utils::calculate_xnos(0, 0, stake.amount, stake.duration);
    let old_duration = stake.duration;

    stake.extend(duration);

    require!(
        stake.duration > old_duration,
        NosanaError::StakeDurationTooShort
    );
    require!(
        stake.duration >= duration::DURATION_MONTH,
        NosanaError::StakeDurationTooShort
    );
    require!(
        stake.duration <= duration::DURATION_YEAR,
        NosanaError::StakeDurationTooLong
    );

    let stats = &mut ctx.accounts.stats;
    stats.sub(old_xnos);
    stats.add(utils::calculate_xnos(0, 0, stake.amount, stake.duration));

    // finish
    Ok(())
}

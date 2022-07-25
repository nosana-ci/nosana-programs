use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Topup<'info> {
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

pub fn handler(ctx: Context<Topup>, amount: u64) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(amount > nos::DECIMALS, NosanaError::StakeAmountNotEnough);
    require!(
        stake.time_unstake == 0_i64,
        NosanaError::StakeAlreadyUnstaked
    );

    // transfer tokens
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // skip signature
        amount,
    )?;

    let old_xnos = utils::calculate_xnos(0, 0, stake.amount, stake.duration);

    stake.topup(amount);

    let stats = &mut ctx.accounts.stats;
    stats.sub(old_xnos);
    stats.add(utils::calculate_xnos(0, 0, stake.amount, stake.duration));

    // finish
    Ok(())
}

use crate::*;

use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    #[account(init, payer = fee_payer, space = STAKE_SIZE)]
    pub stake: Box<Account<'info, StakeAccount>>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    // require!(stake.authority == 0, NosanaError::StakeAlreadyInitialized);
    require!(duration >= DURATION_MIN, NosanaError::DurationNotLongEnough);
    require!(duration <= DURATION_MAX, NosanaError::DurationTooLong);
    require!(amount > 0, NosanaError::AmountNotEnough);

    // transfer tokens
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // skip signature
        amount,
    )?;

    stake.stake(*ctx.accounts.authority.key, amount, duration);

    // finish
    Ok(())
}

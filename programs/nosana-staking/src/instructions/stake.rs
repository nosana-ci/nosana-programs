use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = authority,
        space = STAKE_SIZE,
        seeds = [ b"stake", nos::ID.key().as_ref(), authority.key().as_ref() ],
        bump
    )]
    pub stake: Box<Account<'info, StakeAccount>>,
    #[account(mut, owner = staking::ID)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Stake>, amount: u64, duration: u64) -> Result<()> {
    // get stake and stats
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // test duration and amount
    require!(
        u128::from(duration) >= constants::DURATION_MONTH,
        NosanaError::StakeDurationTooShort
    );
    require!(
        u128::from(duration) <= constants::DURATION_YEAR,
        NosanaError::StakeDurationTooLong
    );
    require!(
        amount > constants::STAKE_MINIMUM,
        NosanaError::StakeAmountNotEnough
    );

    // transfer tokens to vault
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // skip signature
        amount,
    )?;

    // initialize the stake
    stake.init(
        amount,
        *ctx.accounts.authority.key,
        *ctx.bumps.get("stake").unwrap(),
        duration,
    );

    // add xnos to stats
    stats.add(stake.xnos);

    // finish
    Ok(())
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        close = authority,
        owner = staking::ID @ NosanaError::WrongOwner,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaError::StakeNotUnstaked
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    // get and check the stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        ctx.accounts.clock.unix_timestamp
            > stake
                .time_unstake
                .checked_add(i64::try_from(stake.duration).unwrap())
                .unwrap(),
        NosanaError::StakeLocked
    );

    // return tokens, the stake account is closed so no need to update it.
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        stake.amount,
    )?;

    // finish
    Ok(())
}

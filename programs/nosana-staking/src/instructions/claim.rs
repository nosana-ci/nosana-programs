use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        close = authority,
        seeds = [ b"stake", nos::ID.key().as_ref(), authority.key().as_ref() ],
        bump = stake.bump
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Claim>, bump: u8) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(stake.amount != 0_u64, NosanaError::StakeAlreadyClaimed);
    require!(
        stake.duration
            >= u128::try_from(
                ctx.accounts
                    .clock
                    .unix_timestamp
                    .checked_sub(stake.time_unstake)
                    .unwrap()
            )
            .unwrap(),
        NosanaError::StakeLocked
    );

    // return tokens, the stake account is closed so no need to update it.
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        bump,
        stake.amount,
    )?;

    // finish
    Ok(())
}

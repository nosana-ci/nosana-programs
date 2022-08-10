use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub ata_to: Account<'info, TokenAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Slash>, amount: u64) -> Result<()> {
    // get stake account
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;

    // test amount
    require!(amount <= stake.amount, NosanaError::StakeAmountNotEnough);

    // slash stake
    stake.slash(amount);

    // transfer tokens from vault to given ata
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        amount,
    )
}

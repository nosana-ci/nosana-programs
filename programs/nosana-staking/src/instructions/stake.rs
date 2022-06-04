use crate::*;

use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    // transfer tokens
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // skip signature
        amount,
    )?;

    // finish
    Ok(())
}

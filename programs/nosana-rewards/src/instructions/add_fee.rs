use crate::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct AddFee<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ id::NOS_TOKEN.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<AddFee>, amount: u64) -> Result<()> {
    // send tokens to the vault
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // signature provided, no need to sign with PDA
        amount,
    )?;

    // update stats
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    stats.add_fee(u128::from(amount));

    // finish
    Ok(())
}

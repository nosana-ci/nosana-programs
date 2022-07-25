use crate::*;

use anchor_spl::token::{Token, TokenAccount};

pub fn handler(ctx: Context<AddFee>, amount: u64) -> Result<()> {
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // signature provided, no need to sign with PDA
        amount,
    )?;

    let stats = &mut ctx.accounts.stats;
    let tamount = u128::from(amount);
    stats.t_total = stats.t_total.checked_add(tamount).unwrap();
    stats.update_rate();

    Ok(())
}

#[derive(Accounts)]
pub struct AddFee<'info> {
    #[account(mut, owner=ID.key(), seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

use crate::*;

use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, has_one = authority)]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Slash>, amount: u64) -> Result<()> {
    // get and check the stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(amount <= stake.amount, NosanaError::StakeAmountNotEnough);

    // transfer tokens from vault to given ata
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        amount,
    )?;

    // update stats and stake
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.sub(stake.xnos);
    stake.slash(amount);
    stats.add(stake.xnos);

    // finish
    Ok(())
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, owner = staking::ID @ NosanaError::WrongOwner)]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        mut,
        owner = staking::ID @ NosanaError::WrongOwner,
        has_one = authority @ NosanaError::Unauthorized,
    )]
    pub stats: Account<'info, StatsAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Slash>, amount: u64) -> Result<()> {
    // get stake and stats
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // test amount
    require!(amount <= stake.amount, NosanaError::StakeAmountNotEnough);

    // update stake and stats
    stats.sub(stake.xnos);
    stake.slash(amount);
    stats.add(stake.xnos);

    // transfer tokens from vault to given ata
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        amount,
    )?;

    // finish
    Ok(())
}

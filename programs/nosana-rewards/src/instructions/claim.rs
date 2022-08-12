use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ id::NOS_TOKEN.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(owner = id::STAKING_PROGRAM, has_one = authority)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, owner = id::REWARDS_PROGRAM, has_one = authority)]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    // get and check stake, reward, and stats account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);
    require!(stake.xnos >= reward.xnos, NosanaError::StakeDecreased);

    // pay-out tokens
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        reward.get_amount(stats.rate),
    )?;

    // decrease the reflection pool
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    // re-enter the pool with the current stake
    reward.update(stats.add_rewards_account(stake.xnos, 0), stake.xnos);

    // finish
    Ok(())
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_common::{nos, staking, transfer_tokens, NosanaError};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(owner = staking::ID)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"reward", authority.key().as_ref() ], bump = reward.bump)]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    // get and check stake + reward account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Box<Account<RewardAccount>> = &mut ctx.accounts.reward;
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);
    require!(stake.xnos >= reward.xnos, NosanaError::StakeDecreased);
    require!(
        stake.authority == ctx.accounts.ata_to.owner,
        NosanaError::Unauthorized
    );

    // determine pay-out
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;
    let amount: u128 = reward
        .reflection
        .checked_div(stats.rate)
        .unwrap()
        .checked_sub(reward.xnos)
        .unwrap();

    // pay-out tokens
    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        *ctx.bumps.get("ata_vault").unwrap(),
        u64::try_from(amount).ok().unwrap(),
    )?;

    // decrease the reflection pool
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    // re-enter the pool with the current
    reward.update(stats.add_rewards_account(stake.xnos), stake.xnos);

    // finish
    Ok(())
}

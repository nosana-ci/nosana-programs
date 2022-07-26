use crate::*;

use anchor_spl::token::{Token, TokenAccount};

use nosana_staking::program::NosanaStaking;
use nosana_common::{nos, transfer_tokens, NosanaError};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(owner = staking_program.key(), has_one=authority)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"reward", authority.key().as_ref()], bump = reward.bump)]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub staking_program: Program<'info, NosanaStaking>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let stats = &mut ctx.accounts.stats;
    let stake = &ctx.accounts.stake;
    let reward = &mut ctx.accounts.reward;
    let bump: u8 =  *ctx.bumps.get("ata_vault").unwrap();

    // check that the stake is still active, and that the stake has
    // not decreased.
    require!(stake.time_unstake == 0, NosanaError::StakeAlreadyUnstaked);
    require!(u128::from(stake.xnos) >= reward.t_owned, NosanaError::StakeDecreased);

    let towed: u128 = reward.r_owned.checked_div(stats.rate).unwrap();
    let earned_fees: u128 = towed.checked_sub(reward.t_owned).unwrap();

    stats.r_total = stats.r_total.checked_sub(reward.r_owned).unwrap();
    stats.t_total = stats.t_total
        .checked_sub(reward.t_owned)
        .unwrap()
        .checked_sub(earned_fees)
        .unwrap();

    stats.update_rate();

    let reward_amount: u64 = u64::try_from(earned_fees).ok().unwrap();

    transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        bump, // we're signing the vault PDA
        reward_amount
    )?;

    // re-enter
    let tnos: u128 = u128::from(stake.xnos);
    let rnos: u128 = stats.tokens_to_reflection(tnos);

    stats.r_total = stats.r_total.checked_add(rnos).unwrap();
    stats.t_total = stats.t_total.checked_add(tnos).unwrap();
    stats.update_rate();

    reward.t_owned = tnos;
    reward.r_owned = rnos;

    Ok(())
}

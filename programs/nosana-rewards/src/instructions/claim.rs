use crate::*;

use anchor_spl::token::{Token, TokenAccount};

use nosana_staking::program::NosanaStaking;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(owner = staking_program.key())]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, close = authority, seeds = [ b"reward", authority.key().as_ref()], bump = reward.bump)]
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
    // not not decreased.

    // TODO: use xNOS instead of stake.amount

    // TODO: claim should not close the reward account, but instead just reset
    // it as fresh enter. as claim + enter is inefficient (and 2 transactions)

    // TODO: do a CPI to support a claim + topup + enter scheme

    // TODO: if someone unstaked before claiming, we should allow anyone to
    // close their reward account. the accumulated rewards will be distributed
    // to everyone.

    // TODO: it should not be possible to decrease stake ever. but we check that
    // anyways just to be sure. if stake ever decreases we should allow closing
    // of the reward account. else we end up with "ghost" accounts gaining
    // rewards.
    require!(stake.time_unstake == 0, NosanaError::AlreadyUnstaked);
    require!(u128::from(stake.xnos) >= reward.t_owned, NosanaError::StakeDecreased);

    let rowned: u128 = stats.tokens_to_reflection(reward.t_owned);
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

    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        bump, // we're signing the vault PDA
        reward_amount
    )?;

    Ok(())
}

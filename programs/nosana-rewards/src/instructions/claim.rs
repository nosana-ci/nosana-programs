use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut, seeds = [ id::NOS_TOKEN.as_ref() ], bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
        constraint = stake.xnos >= reward.xnos @ NosanaError::StakeDecreased,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    // get stake, reward, and stats account
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // test amount
    let amount: u128 = reward.get_amount(stats.rate);
    require!(amount > 0, NosanaError::NothingToClaim);

    // decrease the reflection pool
    stats.remove_rewards_account(reward.reflection, reward.xnos);

    // re-enter the pool with the current stake
    reward.update(stats.add_rewards_account(stake.xnos, 0), stake.xnos);

    // pay-out reward
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[&[id::NOS_TOKEN.as_ref(), &[*ctx.bumps.get("vault").unwrap()]]],
        ),
        u64::try_from(amount).unwrap(),
    )
}

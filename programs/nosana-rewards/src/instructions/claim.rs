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
    // get rewards and stats account
    let reward: &mut Account<RewardAccount> = &mut ctx.accounts.reward;
    let stats: &mut Account<StatsAccount> = &mut ctx.accounts.stats;

    // determine amount to claim
    let rate: u128 = stats.rate;
    let amount: u128 = reward.get_amount(stats.rate);
    if amount == 0 {
        return Ok(());
    }

    // decrease the reflection pool
    stats.remove_rewards_account(reward.reflection, reward.reflection / rate);

    // re-enter the pool with the current stake
    reward.update(
        stats.add_rewards_account(ctx.accounts.stake.xnos, 0),
        ctx.accounts.stake.xnos,
    );

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

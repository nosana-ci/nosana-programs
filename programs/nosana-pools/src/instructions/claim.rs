use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use nosana_rewards::cpi::accounts::AddFee;
use nosana_rewards::program::NosanaRewards;
use nosana_rewards::StatsAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, address = pool.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub rewards_stats: Account<'info, StatsAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rewards_program: Program<'info, NosanaRewards>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let now: i64 = Clock::get()?.unix_timestamp;
    let pool: &mut Account<PoolAccount> = &mut ctx.accounts.pool;
    let vault: &mut Account<TokenAccount> = &mut ctx.accounts.vault;

    require!(now > pool.start_time, NosanaError::PoolNotStarted);

    let amount = pool.claim(vault.amount, now);

    // TODO: the below is not a requirement anymore, can be removed
    // the pool must have enough funds for an emmission
    require!(amount >= pool.emmission, NosanaError::PoolUnderfunded);

    // TODO: support token transfers
    // transfer tokens from the vault back to the user
    // transfer(
    //     CpiContext::new_with_signer(
    //         ctx.accounts.token_program.to_account_info(),
    //         Transfer {
    //             from: vault.to_account_info(),
    //             to: ctx.accounts.rewards_vault.to_account_info(),
    //             authority: vault.to_account_info(),
    //         },
    //         &[&[b"vault".as_ref(), pool.key().as_ref(), &[pool.vault_bump]]],
    //     ),
    //     3,
    // );

    nosana_rewards::cpi::add_fee(
        CpiContext::new_with_signer(
            ctx.accounts.rewards_program.to_account_info(),
            AddFee {
                user: vault.to_account_info(),
                stats: ctx.accounts.rewards_stats.to_account_info(),
                vault: ctx.accounts.rewards_vault.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            &[&[b"vault".as_ref(), pool.key().as_ref(), &[pool.vault_bump]]],
        ),
        amount,
    )
}

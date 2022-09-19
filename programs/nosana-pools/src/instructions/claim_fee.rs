use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct ClaimFee<'info> {
    #[account(mut, address = pool.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub rewards_reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = Clock::get()?.unix_timestamp > pool.start_time @ NosanaError::PoolNotStarted,
        constraint = pool.claim_type == ClaimType::AddFee as u8 @ NosanaError::PoolWrongClaimType,
        constraint = pool.beneficiary == rewards_vault.key() @ NosanaError::PoolWrongBeneficiary,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rewards_program: Program<'info, NosanaRewards>,
}

pub fn handler(ctx: Context<ClaimFee>) -> Result<()> {
    // get pool and vault
    let pool: &mut Account<PoolAccount> = &mut ctx.accounts.pool;
    let vault: &mut Account<TokenAccount> = &mut ctx.accounts.vault;

    // determine amount
    let amount: u64 = pool.claim(vault.amount, Clock::get()?.unix_timestamp);

    // stop early when there is no error
    if amount < pool.emission {
        return Ok(());
    }

    // send fee
    nosana_rewards::cpi::add_fee(
        CpiContext::new_with_signer(
            ctx.accounts.rewards_program.to_account_info(),
            AddFee {
                user: vault.to_account_info(),
                reflection: ctx.accounts.rewards_reflection.to_account_info(),
                vault: ctx.accounts.rewards_vault.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            &[&[
                constants::PREFIX_VAULT.as_ref(),
                pool.key().as_ref(),
                &[pool.vault_bump],
            ]],
        ),
        amount,
    )
}

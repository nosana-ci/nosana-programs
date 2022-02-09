use anchor_lang::prelude::*;
use anchor_spl::token::{self};

mod ids;
mod state;
mod utils;
mod events;

use ids::*;
use state::*;
use utils::*;
use events::*;

#[program]
pub mod staking {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>, _nonce: u8) -> ProgramResult {
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, nonce: u8, amount: u64) -> ProgramResult {
        let tokens = ctx.accounts.vault.amount;
        let reward = ctx.accounts.reward.supply;

        let token_mint_key = ctx.accounts.tokens.key();
        let seeds = &[token_mint_key.as_ref(), &[nonce]];
        let signer = &[&seeds[..]];

        // stake tokens and assign rewards
        token::transfer(ctx_stake_tokens(ctx.accounts), amount)?;
        token::mint_to(
            ctx_mint_rewards(ctx.accounts, signer),
            if tokens == 0 || reward == 0 {
                amount
            } else {
                calculate_reward(amount, reward, tokens)
            },
        )?;

        // reload
        (&mut ctx.accounts.vault).reload()?;
        (&mut ctx.accounts.reward).reload()?;
        Ok(())
    }

    pub fn unstake(ctx: Context<Stake>, nonce: u8, amount: u64) -> ProgramResult {
        let tokens = ctx.accounts.vault.amount;
        let reward = ctx.accounts.reward.supply;

        let token_mint_key = ctx.accounts.tokens.key();
        let seeds = &[token_mint_key.as_ref(), &[nonce]];
        let signer = &[&seeds[..]];

        // unstake tokens, and burn rewards
        token::transfer(
            ctx_unstake_tokens(ctx.accounts, signer),
            calculate_reward(amount, tokens, reward),
        )?;
        token::burn(ctx_burn_rewards(ctx.accounts), amount)?;

        // refresh
        (&mut ctx.accounts.vault).reload()?;
        (&mut ctx.accounts.reward).reload()?;
        Ok(())
    }

    pub fn emit_price(ctx: Context<EmitPrice>) -> ProgramResult {
        let price = get_price(&ctx.accounts.vault, &ctx.accounts.reward);
        emit!(Price {
            nos_per_xnos_e6: price.0,
            nos_per_xnos: price.1,
        });
        Ok(())
    }
}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};
use std::convert::TryInto;

use crate::state::Stake;


/// # Math

pub fn calculate_reward<'info>(
    amount: u64,
    mul: u64,
    div: u64,
) -> u64 {
    return (amount as u128)
        .checked_mul(mul as u128)
        .unwrap()
        .checked_div(div as u128)
        .unwrap()
        .try_into()
        .unwrap();
}

pub fn get_price<'info>(
    vault: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
) -> (u64, String) {
    let tokens = vault.amount;
    let reward = mint.supply;

    if reward == 0 {
        return (0, String::from("0"));
    }

    let price_uint = calculate_reward(tokens, 1_000_000, reward);
    let price_float = (tokens as f64) / (reward as f64);
    (price_uint, price_float.to_string())
}


/// # Cross program invocations
/// These methods provide context for invoking both the native token,
/// as well as the reward token.


/// Function to get cross-program-invocations context for mint
pub fn ctx_mint_rewards<'a, 'b, 'c, 'info>(
    stake: &mut Stake<'info>,
    signer: &'a [&'b [&'c [u8]]],
) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
    return CpiContext::new_with_signer(
        stake.token_program.to_account_info(),
        token::MintTo {
            mint: stake.reward.to_account_info(),
            to: stake.to.to_account_info(),
            authority: stake.vault.to_account_info(),
        },
        &signer,
    );
}

/// Function to get cross-program-invocations context for transfer
pub fn ctx_stake_tokens<'a, 'b, 'c, 'info>(
    stake: &mut Stake<'info>,
) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
    return CpiContext::new(
        stake.token_program.to_account_info(),
        token::Transfer {
            from: stake.from.to_account_info(),
            to: stake.vault.to_account_info(),
            authority: stake.from_authority.to_account_info(),
        },
    );
}

/// Function to get cross-program-invocations context for transfer with signer
pub fn ctx_unstake_tokens<'a, 'b, 'c, 'info>(
    stake: &mut Stake<'info>,
    signer: &'a [&'b [&'c [u8]]],
) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
    return CpiContext::new_with_signer(
        stake.token_program.to_account_info(),
        token::Transfer {
            from: stake.vault.to_account_info(),
            to: stake.to.to_account_info(),
            authority: stake.vault.to_account_info(),
        },
        signer,
    );
}

/// Function to get cross-program-invocations context for burn
pub fn ctx_burn_rewards<'a, 'b, 'c, 'info>(
    stake: &mut Stake<'info>,
) -> CpiContext<'a, 'b, 'c, 'info, Burn<'info>> {
    return CpiContext::new(
        stake.token_program.to_account_info(),
        token::Burn {
            mint: stake.reward.to_account_info(),
            to: stake.from.to_account_info(),
            authority: stake.from_authority.to_account_info(),
        },
    );
}

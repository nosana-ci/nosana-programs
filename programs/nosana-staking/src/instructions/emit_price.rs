use crate::*;

use anchor_spl::token::{Mint, TokenAccount};

#[derive(Accounts)]
pub struct EmitPrice<'info> {
    #[account(address = nos::ID)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut, address = reward::ID)]
    pub reward: Box<Account<'info, Mint>>,
    #[account(mut, seeds = [ mint.key().as_ref() ], bump,)]
    pub vault: Box<Account<'info, TokenAccount>>,
}

#[event]
pub struct Price {
    pub mint_per_reward_e6: u64,
    pub mint_per_reward: String,
}

pub fn handler(ctx: Context<EmitPrice>) -> Result<()> {
    let price: (u64, String) =
        utils::get_price(ctx.accounts.vault.amount, ctx.accounts.reward.supply);
    emit!(Price {
        mint_per_reward_e6: price.0,
        mint_per_reward: price.1,
    });

    // finish
    Ok(())
}

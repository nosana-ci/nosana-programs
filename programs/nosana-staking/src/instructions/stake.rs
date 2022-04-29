use crate::*;

use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(address = reward::ID)]
    pub reward: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Stake>, bump: u8, amount: u64) -> Result<()> {
    let tokens: u64 = ctx.accounts.ata_vault.amount;
    let reward: u64 = ctx.accounts.reward.supply;

    // transfer tokens
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_from.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        0, // skip signature
        amount,
    )?;

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.reward.to_account_info(),
                to: ctx.accounts.ata_from.to_account_info(),
                authority: ctx.accounts.ata_vault.to_account_info(),
            },
            &[&[crate::ids::nos::ID.as_ref(), &[bump]]],
        ),
        if tokens == 0 || reward == 0 {
            amount
        } else {
            utils::calculate_reward(amount, reward, tokens)
        },
    )?;

    // finish
    Ok(())
}

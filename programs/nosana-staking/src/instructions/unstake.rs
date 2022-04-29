use crate::*;

use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]

pub struct Unstake<'info> {
    #[account(address = reward::ID)]
    pub reward: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Unstake>, bump: u8, amount: u64) -> Result<()> {
    let tokens: u64 = ctx.accounts.ata_vault.amount;
    let reward: u64 = ctx.accounts.reward.supply;

    //  pay out
    utils::transfer_tokens(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        ctx.accounts.ata_to.to_account_info(),
        ctx.accounts.ata_vault.to_account_info(),
        bump,
        utils::calculate_reward(amount, tokens, reward),
    )?;

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.reward.to_account_info(),
                from: ctx.accounts.ata_to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    // finish
    Ok(())
}

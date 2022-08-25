use crate::*;
// use anchor_spl::token::{close_account, transfer, CloseAccount, Token, TokenAccount, Transfer};
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, address = pool.vault @ NosanaError::InvalidTokenAccount)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(_ctx: Context<Claim>) -> Result<()> {
    // // get stake and compose seeds
    // let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    // let seeds: &[&[u8]; 4] = &[
    //     b"vault".as_ref(),
    //     id::NOS_TOKEN.as_ref(),
    //     stake.authority.as_ref(),
    //     &[stake.vault_bump],
    // ];

    // // transfer tokens from the vault back to the user
    // transfer(
    //     CpiContext::new_with_signer(
    //         ctx.accounts.token_program.to_account_info(),
    //         Transfer {
    //             from: ctx.accounts.vault.to_account_info(),
    //             to: ctx.accounts.user.to_account_info(),
    //             authority: ctx.accounts.vault.to_account_info(),
    //         },
    //         &[&seeds[..]],
    //     ),
    //     ctx.accounts.vault.amount,
    // )?;

    // // close the token vault
    // close_account(CpiContext::new_with_signer(
    //     ctx.accounts.token_program.to_account_info(),
    //     CloseAccount {
    //         account: ctx.accounts.vault.to_account_info(),
    //         destination: ctx.accounts.authority.to_account_info(),
    //         authority: ctx.accounts.vault.to_account_info(),
    //     },
    //     &[&seeds[..]],
    // ))
    Ok(())
}

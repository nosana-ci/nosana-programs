use crate::*;
use anchor_spl::token::{close_account, transfer, CloseAccount, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(
        mut,
        close = authority,
        has_one = authority,
        has_one = vault @ NosanaError::InvalidTokenAccount,
        constraint = pool.closeable == true || vault.amount == 0 @ NosanaError::PoolNotCloseable
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Close>) -> Result<()> {
    let pool: &mut Account<PoolAccount> = &mut ctx.accounts.pool;

    // transfer tokens from the vault back to the user
    if ctx.accounts.vault.amount > 0 {
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[&[b"vault".as_ref(), pool.key().as_ref(), &[pool.vault_bump]]],
            ),
            ctx.accounts.vault.amount,
        )?;
    }

    // close the token vault
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.authority.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        &[&[b"vault".as_ref(), pool.key().as_ref(), &[pool.vault_bump]]],
    ))
}

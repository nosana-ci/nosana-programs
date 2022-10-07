use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Recover<'info> {
    #[account(
        mut,
        close = authority,
        has_one = market @ NosanaError::InvalidMarket,
        constraint = job.project == authority.key() @ NosanaError::Unauthorized,
        constraint = job.status == JobStatus::Stopped as u8 @ NosanaError::JobInWrongState,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Recover>) -> Result<()> {
    // recover the funds
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[&[
                ctx.accounts.market.key().as_ref(),
                id::NOS_TOKEN.as_ref(),
                &[ctx.accounts.market.vault_bump],
            ]],
        ),
        ctx.accounts.job.price,
    )
}

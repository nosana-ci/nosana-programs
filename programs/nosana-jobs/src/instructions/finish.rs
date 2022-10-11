use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Finish<'info> {
    #[account(
        mut,
        has_one = market @ NosanaError::InvalidMarketAccount,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(
        mut,
        close = payer,
        has_one = payer @ NosanaError::InvalidPayer,
        has_one = job @ NosanaError::InvalidJobAccount,
        constraint = run.node == authority.key() @ NosanaError::Unauthorized,
    )]
    pub run: Account<'info, RunAccount>,
    #[account(has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    /// CHECK: this account is verified as the original payer for the run account
    pub payer: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
    // finish the job
    ctx.accounts
        .job
        .finish(ipfs_result, Clock::get()?.unix_timestamp);

    // reimburse the node
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

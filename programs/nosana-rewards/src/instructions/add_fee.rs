use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct AddFee<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ id::NOS_TOKEN.as_ref() ], bump)]
    pub vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<AddFee>, amount: u64) -> Result<()> {
    // update stats
    (&mut ctx.accounts.stats).add_fee(u128::from(amount));

    // send fee
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )
}

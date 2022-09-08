use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Finish<'info> {
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub running: Account<'info, JobsAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Finish>, _data: [u8; 32]) -> Result<()> {
    // get job and finish it
    let job: Job = ctx
        .accounts
        .running
        .finish_job(ctx.accounts.authority.key());

    // payout tokens
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[&[id::NOS_TOKEN.as_ref(), &[*ctx.bumps.get("vault").unwrap()]]],
        ),
        job.tokens,
    )
}

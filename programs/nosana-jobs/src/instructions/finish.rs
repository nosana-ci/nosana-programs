use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Finish<'info> {
    #[account(
        mut,
        constraint = job.node == authority.key() @ NosanaError::Unauthorized,
        constraint = job.status == JobStatus::Running as u8 @ NosanaError::JobInWrongState
    )]
    pub job: Account<'info, JobAccount>,
    #[account(has_one = vault @ NosanaError::JobInvalidVault)]
    pub nodes: Account<'info, NodesAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Finish>, ipfs_result: [u8; 32]) -> Result<()> {
    // finish the job
    (&mut ctx.accounts.job).finish(ipfs_result, Clock::get()?.unix_timestamp);

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
                ctx.accounts.nodes.key().as_ref(),
                id::NOS_TOKEN.as_ref(),
                &[ctx.accounts.nodes.vault_bump],
            ]],
        ),
        ctx.accounts.nodes.job_price,
    )
}

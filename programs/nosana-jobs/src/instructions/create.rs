use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub queue: Account<'info, JobsAccount>,
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub running: Account<'info, JobsAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Create>, amount: u64, data: [u8; 32]) -> Result<()> {
    // retrieve job
    let job: &mut Job = &mut ctx.accounts.queue.get_job(RequesterType::Project as u8);

    // create job
    job.create(ctx.accounts.authority.key(), amount, data);

    // check if there is a node ready
    (if job.has_node() {
        &mut ctx.accounts.running
    } else {
        &mut ctx.accounts.queue
    })
    .add_job(job.copy());

    // finish
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

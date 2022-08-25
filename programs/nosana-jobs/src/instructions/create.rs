use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer = fee_payer, space = JOB_SIZE)]
    pub job: Account<'info, JobAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub project: Account<'info, ProjectAccount>,
    #[account(mut, seeds = [ id::TST_TOKEN.as_ref() ], bump)]
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
    // create job
    (&mut ctx.accounts.job).create(data, amount);

    // add job to the project
    (&mut ctx.accounts.project).add_job(ctx.accounts.job.key());

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

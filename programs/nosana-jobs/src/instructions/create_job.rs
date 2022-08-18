use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct CreateJob<'info> {
    #[account(init, payer = fee_payer, space = JOB_SIZE)]
    pub job: Account<'info, Job>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub jobs: Account<'info, Jobs>,
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

pub fn handler(ctx: Context<CreateJob>, amount: u64, data: [u8; 32]) -> Result<()> {
    // retrieve job list and check signature
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;

    // create job
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.create(data, amount);

    // we push the account of the job to the list
    jobs.add_job(ctx.accounts.job.key());

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

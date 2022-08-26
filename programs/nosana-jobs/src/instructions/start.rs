use crate::*;

#[derive(Accounts)]
pub struct Start<'info> {
    #[account(
        init,
        payer = authority,
        space = PROJECT_SIZE,
        seeds = [ b"project", authority.key().as_ref() ],
        bump
    )]
    pub project: Account<'info, ProjectAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Start>) -> Result<()> {
    (&mut ctx.accounts.project).init(ctx.accounts.authority.key());
    Ok(())
}

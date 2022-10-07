use crate::*;

#[derive(Accounts)]
pub struct Quit<'info> {
    #[account(
        mut,
        constraint = job.node == authority.key() @ NosanaError::Unauthorized,
        constraint = job.status == JobStatus::Running as u8 @ NosanaError::Unauthorized
    )]
    pub job: Account<'info, JobAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Quit>) -> Result<()> {
    ctx.accounts.job.quit();
    Ok(())
}

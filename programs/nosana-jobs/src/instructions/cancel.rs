use crate::*;

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(
        mut,
        constraint = job.node == authority.key() @ NosanaError::Unauthorized,
        constraint = job.status == JobStatus::Running as u8 @ NosanaError::Unauthorized
    )]
    pub job: Account<'info, JobAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Cancel>) -> Result<()> {
    (&mut ctx.accounts.job).cancel();
    Ok(())
}

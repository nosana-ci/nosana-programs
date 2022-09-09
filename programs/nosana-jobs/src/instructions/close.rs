use crate::*;

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = job.status == JobStatus::Queued as u8 || job.status == JobStatus::Done as u8
            @ NosanaError::JobInWrongState
    )]
    pub job: Account<'info, JobAccount>,
    pub authority: Signer<'info>,
}

pub fn handler() -> Result<()> {
    //TODO send back tokens when queued
    Ok(())
}

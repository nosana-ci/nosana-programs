use crate::*;

#[derive(Accounts)]
pub struct Complete<'info> {
    #[account(
        mut,
        constraint = job.state == JobState::Done as u8 @ NosanaJobsError::JobInWrongState,
        constraint = job.node == authority.key() @ NosanaError::Unauthorized,
        constraint = job.ipfs_result == JobAccount::NULL_RESULT @ NosanaJobsError::JobResultsAlreadySet,
    )]
    pub job: Box<Account<'info, JobAccount>>,
    pub authority: Signer<'info>,
}

impl<'info> Complete<'info> {
    pub fn handler(&mut self, ipfs_result: [u8; 32]) -> Result<()> {
        require!(
            ipfs_result != JobAccount::NULL_RESULT,
            NosanaJobsError::JobResultNull
        );

        self.job.complete(ipfs_result)
    }
}

use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    #[msg("NosanaError::JobNotClaimed - Job is not in the Claimed state.")]
    JobNotClaimed,
    #[msg("NosanaError::JobNotInitialized - Job is not in the Initialized state.")]
    JobNotInitialized,
    #[msg("NosanaError::JobNotTimedOut - Job is not timed out.")]
    JobNotTimedOut,
    #[msg("NosanaError::JobQueueNotFound - Job queue not found.")]
    JobQueueNotFound,
    #[msg("NosanaError::NodeUnqualifiedUnstaked - Node's stake has been unstaked.")]
    NodeUnqualifiedUnstaked,
    #[msg("NosanaError::NodeUnqualifiedStakeAmount - Node has not staked enough tokens.")]
    NodeUnqualifiedStakeAmount,
    #[msg("NosanaError::Unauthorized - You are not authorized to perform this action.")]
    Unauthorized,
}

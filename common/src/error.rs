use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    #[msg("NosanaError::Unauthorized - You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("NosanaError::StakeAmountNotEnough - This amount is not enough.")]
    StakeAmountNotEnough,
    #[msg("NosanaError::StakeAlreadyInitialized - This stake is already running.")]
    StakeAlreadyInitialized,
    #[msg("NosanaError::StakeAlreadyClaimed - This stake is already claimed.")]
    StakeAlreadyClaimed,
    #[msg("NosanaError::StakeAlreadyStaked - This stake is already staked.")]
    StakeAlreadyStaked,
    #[msg("NosanaError::StakeAlreadyUnstaked - This stake is already unstaked.")]
    StakeAlreadyUnstaked,
    #[msg("NosanaError::StakeNotUnstaked - This stake is not yet unstaked.")]
    StakeNotUnstaked,
    #[msg("NosanaError::StakeLocked - This stake is still locked.")]
    StakeLocked,
    #[msg("NosanaError::StakeDurationTooShort - This stake duration is not long enough.")]
    StakeDurationTooShort,
    #[msg("NosanaError::StakeDurationTooLong - This stake duration is too long.")]
    StakeDurationTooLong,
    #[msg("NosanaError::StakeDecreased - The stake is not allowed to decrease.")]
    StakeDecreased,

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
}

use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    #[msg("NosanaError::Unauthorized - You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("NosanaError::StakeAmountNotEnough - This amount is not enough.")]
    StakeAmountNotEnough,
    #[msg("NosanaError::StakeAlreadyInitialized - This stake is already running.")]
    StakeAlreadyInitialized,
    #[msg("NosanaError::StakeAlreadyStaked - This stake is already unstaked.")]
    StakeAlreadyStaked,
    #[msg("NosanaError::StakeAlreadyUnstaked - This stake is already unstaked.")]
    StakeAlreadyUnstaked,
    #[msg("NosanaError::StakeLocked - This stake is still locked.")]
    StakeLocked,
    #[msg("NosanaError::StakeDurationNotLongEnough - This duration is not long enough.")]
    StakeDurationNotLongEnough,
    #[msg("NosanaError::StakeDurationTooLong - This duration is too long.")]
    StakeDurationTooLong,
}

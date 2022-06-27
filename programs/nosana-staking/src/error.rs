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
    #[msg("NosanaError::StakeLocked - This stake is still locked.")]
    StakeLocked,
    #[msg("NosanaError::StakeDurationTooShort - This stake duration is not long enough.")]
    StakeDurationTooShort,
    #[msg("NosanaError::StakeDurationTooLong - This stake duration is too long.")]
    StakeDurationTooLong,
}

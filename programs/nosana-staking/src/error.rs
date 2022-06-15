use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    #[msg("NosanaError::AmountNotEnough - This amount is not enough.")]
    AmountNotEnough,
    #[msg("NosanaError::Unauthorized - You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("NosanaError::StakeAlreadyInitialized - This stake is already running.")]
    StakeAlreadyInitialized,
    #[msg("NosanaError::StakeAlreadyUnstaked - This stake is already unstaked.")]
    StakeAlreadyUnstaked,
    #[msg("NosanaError::Locked - This stake is still locked.")]
    Locked,
    #[msg("NosanaError::DurationNotLongEnough - This duration is not long enough.")]
    DurationNotLongEnough,
    #[msg("NosanaError::DurationTooLong - This duration is too long.")]
    DurationTooLong,
}

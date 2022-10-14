use anchor_lang::prelude::*;

/***
 * Errors
 */

#[error_code]
pub enum NosanaPoolsError {
    // pool errors
    #[msg("This pool has not started yet.")]
    NotStarted,
    #[msg("This pool does not have enough funds.")]
    Underfunded,
    #[msg("This pool is not closeable.")]
    NotCloseable,
    #[msg("This pool has a different claim type.")]
    WrongClaimType,
    #[msg("This pool does not match the beneficiary.")]
    WrongBeneficiary,
}

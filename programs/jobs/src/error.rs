use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Account not initialized")]
    Uninitialized,
    #[msg("Not authorized")]
    Unauthorized,
}

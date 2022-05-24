use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    #[msg("NosanaError::Unauthorized - You are not authorized to perform this action.")]
    Unauthorized,
}

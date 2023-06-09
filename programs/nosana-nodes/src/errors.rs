use anchor_lang::prelude::*;

/***
 * Errors
 */

#[error_code]
pub enum NosanaNodesError {
    #[msg("This architecture does not exist.")]
    ArchitectureUnknown,
}

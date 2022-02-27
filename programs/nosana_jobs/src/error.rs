use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Account not initialized.")]
    Uninitialized,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Job cannot be claimed because it is already claimed or finished.")]
    NotClaimable,
    #[msg("Job cannot be finished because it is not in a Claimed state.")]
    NotFinishable,
    #[msg("Job queue not found.")]
    JobQueueNotFound,
}

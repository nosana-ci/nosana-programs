use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Job cannot be claimed because it is already claimed or finished.")]
    NotClaimable,
    #[msg("Job cannot be reclaimed because it is not in a claimed state.")]
    NotReclaimable,
    #[msg("Job cannot be finished because it is not in a Claimed state.")]
    NotFinishable,
    #[msg("Job cannot be cancelled because it is in the wrong state.")]
    NotCancelable,
    #[msg("Job queue not found.")]
    JobQueueNotFound,
}

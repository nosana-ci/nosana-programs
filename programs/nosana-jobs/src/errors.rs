use anchor_lang::prelude::*;

/***
 * Errors
 */

#[error_code]
pub enum NosanaJobsError {
    // market errors
    #[msg("This market account is not valid.")]
    InvalidMarketAccount,
    #[msg("This market does not have the right status.")]
    MarketInWrongState,

    // job errors
    #[msg("This job account is not valid.")]
    InvalidJobAccount,
    #[msg("This job does not have the right status.")]
    JobInWrongState,
    #[msg("The job has not yet expired.")]
    JobNotExpired,
    #[msg("The job result can not be null.")]
    JobResultNull,
    #[msg("The job has a different project owner.")]
    JobInvalidProject,
    #[msg("The new job timeout should be larger than the current one.")]
    JobTimeoutNotGreater,
    #[msg("The run account does not match the job.")]
    JobInvalidRunAccount,

    // node errors
    #[msg("This node queue does not match.")]
    NodeQueueDoesNotMatch,
    #[msg("This node is not authorizing this stake.")]
    NodeStakeUnauthorized,
    #[msg("This node has not staked enough tokens.")]
    NodeNotEnoughStake,
    #[msg("This node is already present in the queue.")]
    NodeAlreadyQueued,
    #[msg("This metadata does not have the correct address.")]
    NodeNftWrongMetadata,
    #[msg("This NFT is not owned by this node.")]
    NodeNftWrongOwner,
    #[msg("Access NFT amount cannot be 0.")]
    NodeNftInvalidAmount,
    #[msg("This access key does not belong to a verified collection.")]
    NodeKeyInvalidCollection,
}

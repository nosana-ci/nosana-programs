use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    // generic errors
    #[msg("This account is not authorized to perform this action.")]
    Unauthorized,
    #[msg("This account is owned by an invalid program.")]
    InvalidOwner,
    #[msg("This token account is not valid.")]
    InvalidTokenAccount,
    #[msg("This mint is invalid.")]
    InvalidMint,

    // stake errors
    #[msg("This amount is not enough.")]
    StakeAmountNotEnough,
    #[msg("This stake is already running.")]
    StakeAlreadyInitialized,
    #[msg("This stake is already claimed.")]
    StakeAlreadyClaimed,
    #[msg("This stake is already staked.")]
    StakeAlreadyStaked,
    #[msg("This stake is already unstaked.")]
    StakeAlreadyUnstaked,
    #[msg("This stake is not yet unstaked.")]
    StakeNotUnstaked,
    #[msg("This stake is still locked.")]
    StakeLocked,
    #[msg("This stake duration is not long enough.")]
    StakeDurationTooShort,
    #[msg("This stake duration is too long.")]
    StakeDurationTooLong,
    #[msg("This stake account does not exist.")]
    StakeDoesNotExist,
    #[msg("This stake is not allowed to decrease.")]
    StakeDecreased,
    #[msg("This stake still has a reward account.")]
    StakeHasReward,
    #[msg("This stake does not match the reward account.")]
    StakeDoesNotMatchReward,

    // reward errors
    #[msg("There are no rewards to claim.")]
    NothingToClaim,

    // pool errors
    #[msg("This pool as not started yet.")]
    PoolNotStarted,
    #[msg("This pool does not have enough funds.")]
    PoolUnderfunded,

    // job errors
    #[msg("This job is not in the Claimed state.")]
    JobNotClaimed,
    #[msg("This job is not in the Initialized state.")]
    JobNotInitialized,
    #[msg("This job is not timed out.")]
    JobNotTimedOut,
    #[msg("This job queue not found.")]
    JobQueueNotFound,

    // node errors
    #[msg("This nodes' stake has been unstaked.")]
    NodeUnqualifiedUnstaked,
    #[msg("This node has not staked enough tokens.")]
    NodeUnqualifiedStakeAmount,
}

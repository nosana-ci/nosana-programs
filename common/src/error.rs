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
    #[msg("This account has an invalid vault.")]
    InvalidVault,
    #[msg("This vault is not empty.")]
    VaultNotEmpty,

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

    // job errors
    #[msg("This job does not have the right status.")]
    JobInWrongState,
    #[msg("The job's AccountInfo is not found.")]
    JobInfoNotFound,
    #[msg("The job has not yet expired.")]
    JobNotExpired,
    #[msg("This JobAccount seed is not allowed.")]
    JobSeedAddressViolation,
    #[msg("This JobAccount is already initialized.")]
    JobAccountAlreadyInitialized,
    #[msg("The Market Account is not writable.")]
    MarketNotMutable,

    // node errors
    #[msg("This node does not have an active stake.")]
    NodeNoStake,
    #[msg("This node queue does not match.")]
    NodeQueueDoesNotMatch,
    #[msg("This node has not staked enough tokens.")]
    NodeNotEnoughStake,
    #[msg("This node is already present in the queue.")]
    NodeAlreadyQueued,
    #[msg("This metadata does not have the correct address.")]
    NodeNftWrongMetadata,
    #[msg("This access key does not belong to a verified collection.")]
    NodeKeyInvalidCollection,

    // pool errors
    #[msg("This pool has not started yet.")]
    PoolNotStarted,
    #[msg("This pool does not have enough funds.")]
    PoolUnderfunded,
    #[msg("This pool is not closeable.")]
    PoolNotCloseable,
    #[msg("This pool has a different claim type.")]
    PoolWrongClaimType,
    #[msg("This pool does not match the beneficiary.")]
    PoolWrongBeneficiary,
}

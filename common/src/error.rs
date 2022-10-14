use anchor_lang::prelude::*;

#[error_code]
pub enum NosanaError {
    // generic errors
    #[msg("This account is not authorized to perform this action.")]
    Unauthorized,
    #[msg("This account is owned by an invalid program.")]
    InvalidOwner,
    #[msg("This account has lamports.")]
    LamportsNonNull,
    #[msg("This account is missing a signature.")]
    MissingSignature,
    #[msg("This token account is not valid.")]
    InvalidTokenAccount,
    #[msg("This mint is invalid.")]
    InvalidMint,
    #[msg("This account has an invalid vault.")]
    InvalidVault,
    #[msg("This payer account is not valid.")]
    InvalidPayer,
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

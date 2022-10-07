import { BN } from '@project-serum/anchor';

const decimals = 1e6;
const secondsPerDay = 24 * 60 * 60;
const initialRate = new BN('3402823669209384634633746');

const constants = {
  allowedClockDelta: 3000,
  emission: 20,
  secondsPerDay,
  stakeDurationMin: 14 * secondsPerDay,
  stakeDurationMax: 365 * secondsPerDay,
  decimals,
  mintSupply: 1e7 * decimals,
  userSupply: 1e5 * decimals,
  jobPrice: decimals,
  feePrice: decimals / 10,
  stakeAmount: 1e4 * decimals,
  stakeMinimum: decimals,
  slashAmount: 1e3 * decimals,
  minimumNodeStake: 1e4 * decimals,
  feeAmount: 1e5 * decimals,
  jobTimeout: 5,
  jobExpiration: 5,
  initialRate,

  // status options for jobs
  jobStatus: {
    queued: 0,
    running: 1,
    done: 2,
    quit: 3,
  },

  jobType: {
    default: 0,
    small: 1,
    medium: 2,
    large: 3,
    gpu: 4,
    unknown: 255,
  },

  queueType: {
    job: 0,
    node: 1,
    unknown: 255,
  },

  // type for claim
  claimType: {
    transfer: 0,
    addFee: 1,
  },

  discriminator: 8,

  ipfsData: [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')],

  errors: {
    // generic errors
    Unauthorized: 'This account is not authorized to perform this action.',
    InvalidOwner: 'This account is owned by an invalid program.',
    InvalidTokenAccount: 'This token account is not valid.',
    InvalidMint: 'This mint is invalid.',
    InvalidVault: 'This account has an invalid vault.',
    VaultNotEmpty: 'This vault is not empty.',

    // stake errors
    StakeAmountNotEnough: 'This amount is not enough.',
    StakeAlreadyInitialized: 'This stake is already running.',
    StakeAlreadyClaimed: 'This stake is already claimed.',
    StakeAlreadyStaked: 'This stake is already staked.',
    StakeAlreadyUnstaked: 'This stake is already unstaked.',
    StakeNotUnstaked: 'This stake is not yet unstaked.',
    StakeLocked: 'This stake is still locked.',
    StakeDurationTooShort: 'This stake duration is not long enough.',
    StakeDurationTooLong: 'This stake duration is too long.',
    StakeDoesNotExist: 'This stake account does not exist.',
    StakeDecreased: 'This stake is not allowed to decrease.',
    StakeHasReward: 'This stake still has a reward account.',
    StakeDoesNotMatchReward: 'This stake does not match the reward account.',

    // job errors
    JobInWrongState: 'This job does not have the right status.',
    JobNotExpired: 'The job has not yet expired.',
    JobSeedAddressViolation: 'This JobAccount seed is not allowed.',
    JobAccountAlreadyInitialized: 'This JobAccount is already initialized.',

    // node errors
    NodeNoStake: 'This node does not have an active stake.',
    NodeQueueDoesNotMatch: 'This node queue does not match.',
    NodeStakeUnauthorized: 'This node is not authorizing this stake.',
    NodeNotEnoughStake: 'This node has not staked enough tokens.',
    NodeAlreadyQueued: 'This node is already present in the queue.',
    NodeNftWrongMetadata: 'This metadata does not have the correct address.',
    NodeNftWrongOwner: 'This NFT is not owned by this node.',
    NodeKeyInvalidCollection: 'This access key does not belong to a verified collection.',

    // pool errors
    PoolNotStarted: 'This pool has not started yet.',
    PoolUnderfunded: 'This pool does not have enough funds.',
    PoolNotCloseable: 'This pool is not closeable.',
    PoolWrongClaimType: 'This pool has a different claim type.',
    PoolWrongBeneficiary: 'This pool does not match the beneficiary.',

    // anchor errors
    Solana8ByteConstraint: '8 byte discriminator did not match what was expected',
    SolanaAccountNotInitialized: 'The program expected this account to be already initialized',
  },
};

export { constants };

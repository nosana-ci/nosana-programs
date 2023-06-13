import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

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

  stakingProgramAddress: new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE'),
  rewardsProgramAddress: new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp'),
  poolsProgramAddress: new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD'),
  jobsProgramAddress: new PublicKey('nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR'),
  nodesProgramAddress: new PublicKey('nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD'),

  // status options for jobs
  jobState: {
    queued: 0,
    running: 1,
    done: 2,
    stopped: 3,
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
  ipfsNull: Array(32).fill(0),

  nodeSpecification: {
    architectureType: 0,
    countryCode: 528,
    cpu: 8,
    gpu: 0,
    memory: 16,
    iops: 1000,
    storage: 100,
    endpoint: 'https://nosana.io',
    version: 'v1.0.0',
  },

  errors: {
    // generic errors
    Unauthorized: 'This account is not authorized to perform this action.',
    InvalidAccount: 'This account is not valid.',
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
    InvalidStakeAccount: 'This stake does not belong to the authority.',

    // job errors
    JobInWrongState: 'This job does not have the right status.',
    JobNotExpired: 'The job has not yet expired.',
    JobSeedAddressViolation: 'This JobAccount seed is not allowed.',
    JobResultNull: 'The job result can not be null.',
    RunConstraintNotSatisfied: 'This RunAccount constraint is not satisfied. Use a new or dummy account only.',

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
    SolanaTokenOwnerConstraint: 'A token owner constraint was violated',
  },
};

export { constants };

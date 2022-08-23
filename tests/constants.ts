import * as anchor from '@project-serum/anchor';

const decimals = 1e6;
const secondsPerDay = 24 * 60 * 60;
const initialRate = new anchor.BN('3402823669209384634633746');

const constants = {
  allowedClockDelta: 2000,
  secondsPerDay,
  stakeDurationMin: 14 * secondsPerDay,
  stakeDurationMax: 365 * secondsPerDay,
  decimals,
  mintSupply: 1e7 * decimals,
  userSupply: 1e5 * decimals,
  jobPrice: decimals,
  stakeAmount: 1e4 * decimals,
  stakeMinimum: decimals,
  slashAmount: 1e3 * decimals,
  minimumNodeStake: 1e4 * decimals,
  feeAmount: 1e5 * decimals,

  initialRate,
  rate: initialRate,

  errors: {
    // generic errors
    Unauthorized: 'This account is not authorized to perform this action.',
    InvalidOwner: 'This account is owned by an invalid program.',
    InvalidMint: 'This mint is invalid.',

    // stake errors
    StakeAmountNotEnough: 'This amount is not enough.',
    StakeAlreadyInitialized: 'This stake is already running.',
    StakeAlreadyStaked: 'This stake is already unstaked.',
    StakeAlreadyUnstaked: 'This stake is already unstaked.',
    StakeNotUnstaked: 'This stake is not yet unstaked.',
    StakeLocked: 'This stake is still locked.',
    StakeDurationTooShort: 'This stake duration is not long enough.',
    StakeDurationTooLong: 'This stake duration is too long.',
    StakeHasReward: 'This stake still has a reward account.',
    StakeDoesNotMatchReward: 'This stake does not match the reward account.',

    // job errors
    JobNotClaimed: 'This job is not in the Claimed state.',
    JobNotInitialized: 'This job is not in the Initialized state.',
    JobNotTimedOut: 'This job is not timed out.',
    JobQueueNotFound: 'This job queue not found.',

    // node errors
    NodeUnqualifiedUnstaked: "This nodes' stake has been unstaked.",
    NodeUnqualifiedStakeAmount: 'This node has not staked enough tokens.',

    // anchor errors
    Solana8ByteConstraint: '8 byte discriminator did not match what was expected',
    SolanaAccountNotInitialized: 'The program expected this account to be already initialized',
  },
}

export default constants;

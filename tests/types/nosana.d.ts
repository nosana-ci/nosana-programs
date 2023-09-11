import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Program } from '@coral-xyz/anchor';
// @ts-ignore
import { NosanaStaking } from '../../target/types/nosana_staking';
// @ts-ignore
import { NosanaPools } from '../../target/types/nosana_pools';
// @ts-ignore
import { NosanaJobs } from '../../target/types/nosana_jobs';
// @ts-ignore
import { NosanaRewards } from '../../target/types/nosana_rewards';
// @ts-ignore
import { NosanaNodes } from '../../target/types/nosana_nodes';

type JobsProgram = Program<NosanaJobs>;
type StakingProgram = Program<NosanaStaking>;
type RewardsProgram = Program<NosanaRewards>;
type PoolsProgram = Program<NosanaPools>;
type NodesProgram = Program<NosanaNodes>;

type NosanaTotals = {
  xnos: BN;
  reflection: BN;
  rate: BN;
};

type NosanaExists = {
  stake: boolean;
  pool: boolean;
  market: boolean;
};

type NosanaVaults = {
  staking: PublicKey;
  rewards: PublicKey;
  jobs: PublicKey;
  pools: PublicKey;
};

type NosanaBalances = {
  user: number;
  beneficiary: number;
  vaultJob: number;
  vaultStaking: number;
  vaultRewards: number;
  vaultPool: number;
};

type NosanaMarket = {
  address: PublicKey;
  dummyKey: Keypair;
  usedKey: Keypair;
  jobExpiration: number;
  jobTimeout: number;
  jobType: number;
  jobPrice: number;
  nodeStakeMinimum: number;
  nodeAccessKey: PublicKey;
  queueType: number;
  queueLength: number;
};

type NosanaNodeSpecification = {
  architectureType: number;
  countryCode: number;
  cpu: number;
  gpu: number;
  memory: number;
  iops: number;
  storage: number;
  endpoint: string;
  version: string;
};

type NosanaAccounts = {
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  stakingProgram: PublicKey;
  rewardsProgram: PublicKey;
  nodesProgram: PublicKey;

  // sys vars
  rent: PublicKey;

  // main user
  authority: PublicKey;
  payer: PublicKey;
  project: PublicKey;

  // token
  mint: PublicKey;

  // token accounts
  vault: PublicKey;
  tokenAccount: PublicKey;
  user: PublicKey;
  deposit: PublicKey;

  // staking specific
  settings: PublicKey;
  stake: PublicKey;

  // rewards specific
  reflection: PublicKey;
  reward: PublicKey;
  rewardsVault: PublicKey;
  rewardsReflection: PublicKey;

  // pools specific
  pool: PublicKey;
  poolVault: PublicKey;
  beneficiary: PublicKey;

  // jobs specific
  job: PublicKey;
  run: PublicKey;
  market: PublicKey;
  nft: PublicKey;
  metadata: PublicKey;
  accessKey: PublicKey;

  // nodes specific
  node: PublicKey;
};

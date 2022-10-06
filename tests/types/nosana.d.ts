import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

type NosanaTotals = {
  xnos: BN;
  reflection: BN;
  rate: BN;
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

type NosanaAccounts = {
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  stakingProgram: PublicKey;
  rewardsProgram: PublicKey;

  // sys vars
  rent: PublicKey;

  // main user
  authority: PublicKey;
  feePayer: PublicKey;

  // token
  mint: PublicKey;

  // token accounts
  vault: PublicKey;
  tokenAccount: PublicKey;
  user: PublicKey;

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
  seed: PublicKey;
  oldSeed: PublicKey;
  market: PublicKey;
  nft: PublicKey;
  metadata: PublicKey;
  accessKey: PublicKey;
};

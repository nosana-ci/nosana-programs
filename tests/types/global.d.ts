import { AnchorProvider, Program } from '@project-serum/anchor';
import { Connection, PublicKey, Signer } from '@solana/web3.js';
import { NosanaStaking } from '../../target/types/nosana_staking';
import { NosanaJobs } from '../../target/types/nosana_jobs';
import { NosanaRewards } from '../../target/types/nosana_rewards';
import { Wallet } from '@project-serum/common';
import { Metaplex } from '@metaplex-foundation/js';

declare global {
  var provider: AnchorProvider;
  var connection: Connection;
  var wallet: Wallet;

  var payer: Signer;
  var jobsProgram: Program<NosanaJobs>;
  var stakingProgram: Program<NosanaStaking>;
  var rewardsProgram: Program<NosanaRewards>;
  var metaplex: Metaplex;
  var nosID: PublicKey;

  //TODO : define types
  var collection;
  var accounts;
  var nftConfig;

  var ipfsData;

  var signers;
  var cancelJob;
  var mint;
  var cancelJobs;

  var balances;
  var total;
  var stats;
  var ata;
  var nodes;
  var users;
}

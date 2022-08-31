import { AnchorProvider, BN, Program } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, Signer } from '@solana/web3.js';
import { Wallet } from '@project-serum/common';
import { CreateNftInput, Metaplex } from '@metaplex-foundation/js';

import { NosanaStaking } from '../../target/types/nosana_staking';
import { NosanaPools } from '../../target/types/nosana_pools';
import { NosanaJobs } from '../../target/types/nosana_jobs';
import { NosanaRewards } from '../../target/types/nosana_rewards';
import { constants } from '../contstants';

declare module 'mocha' {
  export interface Context {
    provider: AnchorProvider;
    connection: Connection;
    wallet: Wallet;
    payer: Signer;
    publicKey: PublicKey;
    // main programs
    jobsProgram: Program<NosanaJobs>;
    stakingProgram: Program<NosanaStaking>;
    rewardsProgram: Program<NosanaRewards>;
    poolsProgram: Program<NosanaPools>;
    // the mint
    mint: PublicKey;
    // metaplex
    metaplex: Metaplex;
    nftConfig: CreateNftInput;
    // jobs program
    ipfsData: number[];

    total: { xnos: BN; reflection: BN; rate: BN };
    vaults: { staking: PublicKey; rewards: PublicKey; jobs: PublicKey };
    balances: { user: number; vaultJob: number; vaultStaking: number; vaultRewards: number };

    // public key collections
    accounts: {
      // programs
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
      stats: PublicKey;
      reward: PublicKey;
      rewardsVault: PublicKey;
      rewardsStats: PublicKey;

      // pools specific
      pool: PublicKey;
      poolVault: PublicKey;
      beneficiary: PublicKey;

      // jobs specific
      job: PublicKey;
      project: PublicKey;
      nft: PublicKey;
      metadata: PublicKey;
    };

    //TODO : define types
    constants;
    nodes;
    users;
  }
}

import { AnchorProvider, Program } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, Signer } from '@solana/web3.js';
import { NosanaStaking } from '../../../target/types/nosana_staking';
import { NosanaPools } from '../../../target/types/nosana_pools';
import { NosanaJobs } from '../../../target/types/nosana_jobs';
import { NosanaRewards } from '../../../target/types/nosana_rewards';
import { Wallet } from '@project-serum/common';
import { CreateNftInput, Metaplex } from '@metaplex-foundation/js';

declare global {
  var // anchor setup
    provider: AnchorProvider,
    connection: Connection,
    wallet: Wallet,
    payer: Signer,
    publicKey: PublicKey,
    // main programs
    jobsProgram: Program<NosanaJobs>,
    stakingProgram: Program<NosanaStaking>,
    rewardsProgram: Program<NosanaRewards>,
    poolsProgram: Program<NosanaPools>,
    // single public keys
    nosID: PublicKey,
    mint: PublicKey,
    // metaplex
    metaplex: Metaplex,
    nftConfig: CreateNftInput,
    // jobs program
    cancelJob: Keypair,
    ipfsData: number[],
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
      beneficiary: PublicKey;

      // jobs specific
      job: PublicKey;
      project: PublicKey;
      nft: PublicKey;
      metadata: PublicKey;
    },
    ata: {
      user: PublicKey;
      userVault: PublicKey;
      vaultJob: PublicKey;
      userVaultStaking: PublicKey;
      vaultRewards: PublicKey;
      nft: PublicKey;
    },
    //TODO : define types
    constants,
    signers,
    balances,
    total,
    stats,
    nodes,
    users;
}

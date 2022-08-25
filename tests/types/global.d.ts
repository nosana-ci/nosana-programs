import { AnchorProvider, Program } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, Signer } from '@solana/web3.js';
import { NosanaStaking } from '../../target/types/nosana_staking';
import { NosanaJobs } from '../../target/types/nosana_jobs';
import { NosanaRewards } from '../../target/types/nosana_rewards';
import { Wallet } from '@project-serum/common';
import { Metaplex } from '@metaplex-foundation/js';
import { CreateNftInput } from '@metaplex-foundation/js/src/plugins/nftModule/createNft';

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
    // single public keys
    nosID: PublicKey,
    mint: PublicKey,
    // metaplex
    metaplex: Metaplex,
    collection: PublicKey,
    nftConfig: CreateNftInput,
    // jobs program
    cancelJob: Keypair,
    ipfsData: number[],
    // public key collections
    accounts: {
      systemProgram: PublicKey;
      tokenProgram: PublicKey;
      stakingProgram: PublicKey;

      // sys vars
      rent: PublicKey;

      // main user
      authority: PublicKey;
      feePayer: PublicKey;

      // Solana accounts for ci/cd and staking
      job: PublicKey;
      stake: PublicKey;
      reward: PublicKey;

      // token and ATAs (tbd)
      tokenAccount: PublicKey;
      project: PublicKey;
      mint: PublicKey;
      vault: PublicKey;
      stats: PublicKey;
      settings: PublicKey;
      user: PublicKey;
      nft: PublicKey;
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

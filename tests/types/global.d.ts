import { AnchorProvider, Program } from '@project-serum/anchor';
import { Connection, PublicKey, Signer } from '@solana/web3.js';
import { NosanaStaking } from '../../target/types/nosana_staking';
import { NosanaJobs } from '../../target/types/nosana_jobs';
import { NosanaRewards } from '../../target/types/nosana_rewards';
import { Wallet } from '@project-serum/common';
import { Metaplex } from '@metaplex-foundation/js';

declare global {
  var provider: AnchorProvider,
    connection: Connection,
    wallet: Wallet,
    payer: Signer,
    jobsProgram: Program<NosanaJobs>,
    stakingProgram: Program<NosanaStaking>,
    rewardsProgram: Program<NosanaRewards>,
    metaplex: Metaplex,
    nosID: PublicKey,
    //TODO : define types
    collection,
    constants,
    accounts,
    nftConfig,
    ipfsData,
    signers,
    cancelJob,
    mint,
    cancelJobs,
    balances,
    total,
    stats,
    ata,
    nodes,
    users;
}

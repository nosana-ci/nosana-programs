import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Connection, PublicKey, Signer } from '@solana/web3.js';
import { CreateNftInput, Metaplex } from '@metaplex-foundation/js';

import { NosanaStaking } from '../../target/types/nosana_staking';
import { NosanaPools } from '../../target/types/nosana_pools';
import { NosanaJobs } from '../../target/types/nosana_jobs';
import { NosanaRewards } from '../../target/types/nosana_rewards';
import { constants } from '../contstants';
import { NosanaAccounts, NosanaBalances, NosanaMarket, NosanaTotals, NosanaVaults } from './nosana';

declare module 'mocha' {
  export interface Context {
    // anchor
    provider: AnchorProvider;
    connection: Connection;

    // user
    wallet: Wallet;
    payer: Signer;
    publicKey: PublicKey;

    // mint
    mint: PublicKey;

    // main programs
    jobsProgram: Program<NosanaJobs>;
    stakingProgram: Program<NosanaStaking>;
    rewardsProgram: Program<NosanaRewards>;
    poolsProgram: Program<NosanaPools>;

    // metaplex
    metaplex: Metaplex;
    nftConfig: CreateNftInput;

    // dynamic values
    total: NosanaTotals;
    balances: NosanaBalances;
    market: NosanaMarket;
    marketClosed: boolean;
    poolClosed: boolean;

    // public key collections
    vaults: NosanaVaults;
    accounts: NosanaAccounts;

    // th constant values
    constants: constants;

    //TODO : define Solana user types
    nodes;
    users;
  }
}

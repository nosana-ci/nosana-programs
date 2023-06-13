import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey, Signer } from '@solana/web3.js';
import { CreateNftInput, Metaplex } from '@metaplex-foundation/js';

import { constants } from '../contstants';
import {
  JobsProgram,
  NodesProgram,
  NosanaAccounts,
  NosanaBalances,
  NosanaExists,
  NosanaMarket,
  NosanaTotals,
  NosanaVaults,
  PoolsProgram,
  RewardsProgram,
  StakingProgram,
} from './nosana';

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
    jobsProgram: JobsProgram;
    stakingProgram: StakingProgram;
    rewardsProgram: RewardsProgram;
    poolsProgram: PoolsProgram;
    nodesProgram: NodesProgram;

    // metaplex
    metaplex: Metaplex;
    nftConfig: CreateNftInput;

    // dynamic values
    total: NosanaTotals;
    balances: NosanaBalances;
    market: NosanaMarket;
    exists: NosanaExists;

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

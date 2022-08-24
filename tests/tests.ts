// imports
import * as anchor from '@project-serum/anchor';
import * as _ from 'lodash';
import * as utils from './utils';
import { expect } from 'chai';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import { NosanaStaking } from '../target/types/nosana_staking';
import { NosanaJobs } from '../target/types/nosana_jobs';
import { NosanaRewards } from '../target/types/nosana_rewards';
import { Metaplex, walletOrGuestIdentity } from '@metaplex-foundation/js';

import c from './constants';

import initTests from './0_init';
import stakingTests from './1_staking';
import rewardTests from './2_rewards';
import jobTests from './3_jobs';

describe('nosana programs', async function () {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const wallet = provider.wallet;

  before(function () {
    this.provider = provider;
    this.connection = connection;
    this.wallet = wallet;

    // @ts-ignore
    this.payer = wallet.payer as anchor.web3.Signer;
    this.jobsProgram = anchor.workspace.NosanaJobs as anchor.Program<NosanaJobs>;
    this.stakingProgram = anchor.workspace.NosanaStaking as anchor.Program<NosanaStaking>;
    this.rewardsProgram = anchor.workspace.NosanaRewards as anchor.Program<NosanaRewards>;
    this.metaplex = Metaplex.make(connection).use(walletOrGuestIdentity(wallet));

    this.nosID = new anchor.web3.PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
    this.ipfsData = [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')];

    // Jobs account for the tests.
    this.signers = {
      jobs: anchor.web3.Keypair.generate(),
      job: anchor.web3.Keypair.generate(),
    };
    this.cancelJob = anchor.web3.Keypair.generate();
    this.cancelJobs = anchor.web3.Keypair.generate();

    this.collection = anchor.web3.Keypair.generate().publicKey;
    this.nftConfig = {
      uri: 'https://arweave.net/123',
      name: 'Test NFT',
      symbol: 'NOS-NFT',
      sellerFeeBasisPoints: 0,
      collection: {
        verified: false,
        key: this.collection,
      },
    };

    // public keys
    this.accounts = {
      // program ids
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      stakingProgram: this.stakingProgram.programId,

      // sys vars
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

      // main user
      authority: provider.wallet.publicKey,
      feePayer: provider.wallet.publicKey,

      // Solana accounts for ci/cd and staking
      jobs: this.signers.jobs.publicKey,
      job: this.signers.job.publicKey,
      stake: undefined,
      reward: undefined,

      // token and ATAs (tbd)
      tokenAccount: undefined,
      mint: undefined,
      vault: undefined,
      stats: undefined,
      settings: undefined,
      user: undefined,
      nft: undefined,
    };


    this.global = { xnos: new anchor.BN(0), reflection: new anchor.BN(0), rate: c.initialRate };

    this.users = {user1: null, user2: null, user3: null, user4: null, otherUsers: null};
    this.nodes = {node1: null, node2: null, otherNodes: null};

    this.ata = {
      user: undefined,
      userVault: undefined,
      vaultJob: undefined,
      userVaultStaking: undefined,
      vaultRewards: undefined,
      nft: undefined,
    };

    this.stats = { staking: undefined, rewards: undefined };
    this.balances = { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0 };
  });

  describe('initialization', initTests.bind(this));
  describe('staking', stakingTests.bind(this));
  describe('rewards', rewardTests.bind(this));
  describe('jobs', jobTests.bind(this));
});

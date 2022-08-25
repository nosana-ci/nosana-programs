// imports
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NosanaStaking } from '../target/types/nosana_staking';
import { NosanaJobs } from '../target/types/nosana_jobs';
import { NosanaRewards } from '../target/types/nosana_rewards';
import { Metaplex, walletOrGuestIdentity } from '@metaplex-foundation/js';

import c from './constants';

import initTests from './suites/0-initialization-tests';
import stakingTests from './suites/1-nosana-staking-tests';
import rewardTests from './suites/2-nosana-rewards-tests';
import jobTests from './suites/4-nosana-jobs-tests';

describe('nosana programs', async function () {
  before(function () {
    // anchor
    global.provider = anchor.AnchorProvider.env();
    global.connection = provider.connection;
    global.wallet = provider.wallet;
    // @ts-ignore
    global.payer = wallet.payer;

    // programs
    global.jobsProgram = anchor.workspace.NosanaJobs;
    global.stakingProgram = anchor.workspace.NosanaStaking;
    global.rewardsProgram = anchor.workspace.NosanaRewards;
    global.metaplex = Metaplex.make(connection).use(walletOrGuestIdentity(wallet));

    // public keys
    global.nosID = new anchor.web3.PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
    global.ipfsData = [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')];

    // Jobs account for the tests.
    global.signers = {
      jobs: anchor.web3.Keypair.generate(),
      job: anchor.web3.Keypair.generate(),
    };
    global.cancelJob = anchor.web3.Keypair.generate();
    global.cancelJobs = anchor.web3.Keypair.generate();
    global.nftConfig = {
      uri: 'https://arweave.net/123',
      name: 'Test NFT',
      symbol: 'NOS-NFT',
      sellerFeeBasisPoints: 0,
      collection: {
        verified: false,
        key: anchor.web3.Keypair.generate().publicKey,
      },
    };

    // public keys
    global.accounts = {
      // program ids
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      stakingProgram: global.stakingProgram.programId,

      // sys vars
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

      // main user
      authority: global.provider.wallet.publicKey,
      feePayer: global.provider.wallet.publicKey,

      // Solana accounts for ci/cd and staking
      jobs: global.signers.jobs.publicKey,
      job: global.signers.job.publicKey,
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

    global.total = { xnos: new anchor.BN(0), reflection: new anchor.BN(0), rate: c.initialRate };

    global.users = { user1: null, user2: null, user3: null, user4: null, otherUsers: null };
    global.nodes = { node1: null, node2: null, otherNodes: null };

    global.ata = {
      user: undefined,
      userVault: undefined,
      vaultJob: undefined,
      userVaultStaking: undefined,
      vaultRewards: undefined,
      nft: undefined,
    };

    global.stats = { staking: undefined, rewards: undefined };
    global.balances = { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0 };
  });

  describe('initialization', initTests);
  describe('staking', stakingTests);
  describe('rewards', rewardTests);
  describe('jobs', jobTests);
});

// imports
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metaplex, walletOrGuestIdentity } from '@metaplex-foundation/js';
import c from './constants';

// suites
import initTests from './suites/0-initialization-tests';
import stakingTests from './suites/1-nosana-staking-tests';
import rewardTests from './suites/2-nosana-rewards-tests';
import poolTests from './suites/3-nosana-pools-tests';
import jobTests from './suites/4-nosana-jobs-tests';

describe('nosana programs', async function () {
  before(function () {
    // constant values
    global.constants = c;

    // anchor
    global.provider = anchor.AnchorProvider.env();
    global.connection = provider.connection;
    global.wallet = provider.wallet;
    global.publicKey = provider.wallet.publicKey;
    // @ts-ignore
    global.payer = wallet.payer;

    // programs
    global.jobsProgram = anchor.workspace.NosanaJobs;
    global.poolsProgram = anchor.workspace.NosanaPools;
    global.stakingProgram = anchor.workspace.NosanaStaking;
    global.rewardsProgram = anchor.workspace.NosanaRewards;
    global.metaplex = Metaplex.make(connection).use(walletOrGuestIdentity(wallet));

    // public keys
    global.nosID = new anchor.web3.PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
    global.signers = { job: anchor.web3.Keypair.generate() };
    global.cancelJob = anchor.web3.Keypair.generate();

    // public keys
    global.accounts = {
      // program ids
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      stakingProgram: global.stakingProgram.programId,

      // sys vars
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,

      // main user
      authority: global.provider.wallet.publicKey,
      feePayer: global.provider.wallet.publicKey,

      // Solana accounts for ci/cd and staking
      job: global.signers.job.publicKey,
      stake: undefined,
      reward: undefined,

      // token and ATAs (tbd)
      tokenAccount: undefined,
      project: undefined,
      mint: undefined,
      vault: undefined,
      stats: undefined,
      settings: undefined,
      user: undefined,
      nft: undefined,
    };

    // token accounts
    global.ata = {
      user: undefined,
      userVault: undefined,
      vaultJob: undefined,
      userVaultStaking: undefined,
      vaultRewards: undefined,
      nft: undefined,
    };

    // ipfs
    global.ipfsData = [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')];

    // nft
    global.collection = anchor.web3.Keypair.generate().publicKey;
    global.nftConfig = {
      uri: 'https://arweave.net/123',
      name: 'Test NFT',
      symbol: 'NOS-NFT',
      sellerFeeBasisPoints: 0,
      collection: {
        verified: false,
        key: global.collection,
      },
    };

    // dynamic values
    global.total = { xnos: new anchor.BN(0), reflection: new anchor.BN(0), rate: c.initialRate };
    global.users = { user1: null, user2: null, user3: null, user4: null, otherUsers: null };
    global.nodes = { node1: null, node2: null, otherNodes: null };
    global.stats = { staking: undefined, rewards: undefined };
    global.balances = { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0 };
  });

  describe('initialization', initTests);
  describe('staking', stakingTests);
  describe('rewards', rewardTests);
  describe('pools', poolTests);
  describe('jobs', jobTests);
});

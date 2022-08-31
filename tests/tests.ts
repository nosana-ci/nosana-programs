// external imports
import { before } from 'mocha';
import * as anchor from '@project-serum/anchor';
import { CreateNftInput, Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { constants } from './contstants';
import { pda } from './utils';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';

// local test suites
import initTests from './suites/1-initialization-tests';
import stakingTests from './suites/2-nosana-staking-tests';
import rewardTests from './suites/3-nosana-rewards-tests';
import poolTests from './suites/4-nosana-pools-tests';
import jobTests from './suites/5-nosana-jobs-tests';

// local test scenarios
import rewardScenario from './suites/scenario/rewards-tests';

// types
import { NosanaAccounts, NosanaVaults } from './types/nosana';

// run
describe('nosana programs', async function () {
  before(async function () {
    // anchor
    this.provider = anchor.AnchorProvider.env();
    this.connection = this.provider.connection;

    // main user
    this.wallet = this.provider.wallet;
    this.publicKey = this.wallet.publicKey;
    this.payer = this.wallet.payer;

    // programs
    this.jobsProgram = anchor.workspace.NosanaJobs;
    this.poolsProgram = anchor.workspace.NosanaPools;
    this.stakingProgram = anchor.workspace.NosanaStaking;
    this.rewardsProgram = anchor.workspace.NosanaRewards;
    this.rewardsProgram1 = anchor.workspace.NosanaRewards;
    this.metaplex = Metaplex.make(this.connection).use(walletAdapterIdentity(this.wallet));

    // constant values
    this.constants = constants;
    this.mint = new PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');

    // nft
    this.nftConfig = {} as CreateNftInput;
    this.nftConfig.uri = 'https://arweave.net/123';
    this.nftConfig.name = 'Burner Phone NFT';
    this.nftConfig.symbol = 'NOS-NFT';
    this.nftConfig.sellerFeeBasisPoints = 0;
    this.nftConfig.isCollection = true;
    // we need an Anchor Public Key :/
    this.nftConfig.collection = new anchor.web3.PublicKey('mxAC93BiaqQ6RrzaMpGD6QotuTd8gUTSJ9sCPkyJmHT');

    // dynamic values
    this.total = { xnos: new BN(0), reflection: new BN(0), rate: constants.initialRate };
    this.users = { user1: null, user2: null, user3: null, user4: null, otherUsers: null };
    this.nodes = { node1: null, node2: null, otherNodes: null };
    this.balances = { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0, vaultPool: 0 };
    this.poolClosed = true;

    // token vaults public keys
    this.vaults = {} as NosanaVaults;
    this.vaults.jobs = await pda([this.mint.toBuffer()], this.jobsProgram.programId);
    this.vaults.rewards = await pda([this.mint.toBuffer()], this.rewardsProgram.programId);
    this.vaults.staking = await pda(
      [utf8.encode('vault'), this.mint.toBuffer(), this.publicKey.toBuffer()],
      this.stakingProgram.programId
    );

    // public keys to be used in the instructions
    this.accounts = {} as NosanaAccounts;
    this.accounts.systemProgram = anchor.web3.SystemProgram.programId;
    this.accounts.tokenProgram = TOKEN_PROGRAM_ID;
    this.accounts.stakingProgram = this.stakingProgram.programId;
    this.accounts.rewardsProgram = this.rewardsProgram.programId;
    this.accounts.rent = anchor.web3.SYSVAR_RENT_PUBKEY;
    this.accounts.authority = this.publicKey;
    this.accounts.feePayer = this.publicKey;
    this.accounts.mint = this.mint;
    this.accounts.tokenAccount = await getAssociatedTokenAddress(this.mint, this.publicKey);
    this.accounts.user = await getAssociatedTokenAddress(this.mint, this.publicKey);
    this.accounts.settings = await pda([utf8.encode('settings')], this.stakingProgram.programId);
    this.accounts.stats = await pda([utf8.encode('stats')], this.rewardsProgram.programId);
    this.accounts.reward = await pda([utf8.encode('reward'), this.publicKey.toBuffer()], this.rewardsProgram.programId);
    this.accounts.beneficiary = this.vaults.rewards;
    this.accounts.rewardsVault = this.vaults.rewards;
    this.accounts.rewardsStats = await pda([utf8.encode('stats')], this.rewardsProgram.programId);
    this.accounts.project = await pda([utf8.encode('project'), this.publicKey.toBuffer()], this.jobsProgram.programId);
    this.accounts.stake = await pda(
      [utf8.encode('stake'), this.mint.toBuffer(), this.publicKey.toBuffer()],
      this.stakingProgram.programId
    );
  });

  switch (process.env.TEST_SCENARIO) {
    default:
    case 'all':
      describe('initialization', initTests);
      describe('staking', stakingTests);
      describe('rewards', rewardTests);
      describe('pools', poolTests);
      describe('jobs', jobTests);
      break;
    case 'jobs':
      describe('initialization', initTests);
      describe('staking', stakingTests);
      describe('jobs', jobTests);
      break;
    case 'pools':
      describe('initialization', initTests);
      describe('staking', stakingTests);
      describe('rewards', rewardTests);
      describe('pools', poolTests);
      break;
    case 'rewards':
      describe('initialization', initTests);
      describe('rewards-scenario', rewardScenario);
      break;
    case 'staking':
      describe('initialization', initTests);
      describe('staking', stakingTests);
      break;
  }
});

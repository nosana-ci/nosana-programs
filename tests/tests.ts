// external imports
import { before } from 'mocha';
import * as anchor from '@coral-xyz/anchor';
import { CreateNftInput, Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { constants } from './contstants';
import { getDummyKey, pda } from './utils';
import { utf8 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

// local test suites
import initTests from './suites/1-initialization-tests';
import stakingTests from './suites/2-nosana-staking-tests';
import stakingInitTests from './suites/2-nosana-staking-init-tests';
import rewardTests from './suites/3-nosana-rewards-tests';
import rewardInitTests from './suites/3-nosana-rewards-init-tests';
import poolTests from './suites/4-nosana-pools-tests';
import jobTests from './suites/5-nosana-jobs-tests';
import nodesTests from './suites/6-nosana-nodes-tests';

// local test scenarios
import rewardScenario from './suites/scenario/rewards-tests';
import claimTransferScenario from './suites/scenario/claim-transfer-tests';

// types
import { NosanaAccounts, NosanaExists, NosanaMarket, NosanaNodeSpecification, NosanaVaults } from './types/nosana';

// run
describe('nosana programs', async function () {
  before(async function () {
    // anchor
    this.provider = anchor.AnchorProvider.env();
    this.connection = this.provider.connection;

    // main user
    this.wallet = this.provider.wallet as anchor.Wallet;
    this.publicKey = this.wallet.publicKey;
    this.payer = this.wallet.payer;

    // programs
    this.jobsProgram = anchor.workspace.NosanaJobs;
    this.poolsProgram = anchor.workspace.NosanaPools;
    this.stakingProgram = anchor.workspace.NosanaStaking;
    this.rewardsProgram = anchor.workspace.NosanaRewards;
    this.nodesProgram = anchor.workspace.NosanaNodes;
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

    // dynamic values
    this.total = { xnos: new BN(0), reflection: new BN(0), rate: constants.initialRate };
    this.users = { user1: null, user2: null, user3: null, user4: null, otherUsers: null };
    this.nodes = { node1: null, node2: null, otherNodes: null };
    this.balances = { user: 0, beneficiary: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0, vaultPool: 0 };

    this.exists = {} as NosanaExists;
    this.exists.stake = false;

    // token vaults public keys
    this.vaults = {} as NosanaVaults;
    this.vaults.jobs = await pda([this.mint.toBuffer()], this.jobsProgram.programId);
    this.vaults.rewards = await pda([this.mint.toBuffer()], this.rewardsProgram.programId);
    this.vaults.staking = await pda(
      [utf8.encode('vault'), this.mint.toBuffer(), this.publicKey.toBuffer()],
      this.stakingProgram.programId,
    );

    // nosana market
    this.market = {} as NosanaMarket;
    this.market.dummyKey = await getDummyKey();
    this.market.jobExpiration = this.constants.jobTimeout;
    this.market.jobPrice = this.constants.jobPrice;
    this.market.jobTimeout = this.constants.jobTimeout;
    this.market.jobType = this.constants.jobType.default;
    this.market.nodeStakeMinimum = this.constants.minimumNodeStake;
    this.market.queueType = this.constants.queueType.unknown;
    this.market.queueLength = 0;

    this.nodeSpec = this.constants.nodeSpecification as NosanaNodeSpecification;

    // public keys to be used in the instructions
    this.accounts = {} as NosanaAccounts;
    this.accounts.systemProgram = anchor.web3.SystemProgram.programId;
    this.accounts.tokenProgram = TOKEN_PROGRAM_ID;
    this.accounts.stakingProgram = this.stakingProgram.programId;
    this.accounts.rewardsProgram = this.rewardsProgram.programId;
    this.accounts.nodesProgram = this.nodesProgram.programId;
    this.accounts.rent = anchor.web3.SYSVAR_RENT_PUBKEY;
    this.accounts.authority = this.publicKey;
    this.accounts.payer = this.publicKey;
    this.accounts.payerRun = this.publicKey;
    this.accounts.payerJob = this.publicKey;
    this.accounts.project = this.publicKey;
    this.accounts.mint = this.mint;
    this.accounts.user = await getAssociatedTokenAddress(this.mint, this.publicKey);
    this.accounts.deposit = this.accounts.user;
    this.accounts.reflection = await pda([utf8.encode('reflection')], this.rewardsProgram.programId);
    this.accounts.reward = await pda([utf8.encode('reward'), this.publicKey.toBuffer()], this.rewardsProgram.programId);
    this.accounts.settings = await pda([utf8.encode('settings')], this.stakingProgram.programId);
    this.accounts.beneficiary = this.vaults.rewards;
    this.accounts.tokenAccount = this.accounts.user;
    this.accounts.rewardsVault = this.vaults.rewards;
    this.accounts.rewardsReflection = this.accounts.reflection;
    this.accounts.node = await pda([utf8.encode('node'), this.publicKey.toBuffer()], this.nodesProgram.programId);
    this.accounts.stake = await pda(
      [utf8.encode('stake'), this.mint.toBuffer(), this.publicKey.toBuffer()],
      this.stakingProgram.programId,
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
      describe('nodes', nodesTests);
      break;
    case 'claim-transfer':
      describe('initialization', initTests);
      describe('claim-transfer-scenario', claimTransferScenario);
      break;
    case 'jobs':
      describe('initialization', initTests);
      describe('staking', stakingInitTests);
      describe('rewards', rewardInitTests);
      describe('jobs', jobTests);
      break;
    case 'nodes':
      describe('initialization', initTests);
      describe('nodes', nodesTests);
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

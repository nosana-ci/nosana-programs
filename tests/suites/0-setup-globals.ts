import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';
import { BN } from '@project-serum/anchor';
import {Keypair, PublicKey} from "@solana/web3.js";

const decimals = 1e6;
const secondsPerDay = 24 * 60 * 60;
const initialRate = new BN('3402823669209384634633746');

export default function suite() {
  describe('setup all the global variables', function () {
    it('can set global variables', function () {
      // constant values
      global.constants = {
        allowedClockDelta: 2000,
        secondsPerDay,
        stakeDurationMin: 14 * secondsPerDay,
        stakeDurationMax: 365 * secondsPerDay,
        decimals,
        mintSupply: 1e7 * decimals,
        userSupply: 1e5 * decimals,
        jobPrice: decimals,
        stakeAmount: 1e4 * decimals,
        stakeMinimum: decimals,
        slashAmount: 1e3 * decimals,
        minimumNodeStake: 1e4 * decimals,
        feeAmount: 1e5 * decimals,

        initialRate,

        // status options for jobs
        jobStatus: {
          created: 0,
          claimed: 1,
          finished: 2,
        },

        errors: {
          // generic errors
          Unauthorized: 'This account is not authorized to perform this action.',
          InvalidOwner: 'This account is owned by an invalid program.',
          InvalidMint: 'This mint is invalid.',

          // stake errors
          StakeAmountNotEnough: 'This amount is not enough.',
          StakeAlreadyInitialized: 'This stake is already running.',
          StakeAlreadyStaked: 'This stake is already unstaked.',
          StakeAlreadyUnstaked: 'This stake is already unstaked.',
          StakeNotUnstaked: 'This stake is not yet unstaked.',
          StakeLocked: 'This stake is still locked.',
          StakeDurationTooShort: 'This stake duration is not long enough.',
          StakeDurationTooLong: 'This stake duration is too long.',
          StakeHasReward: 'This stake still has a reward account.',
          StakeDoesNotMatchReward: 'This stake does not match the reward account.',

          // job errors
          JobNotClaimed: 'This job is not in the Claimed state.',
          JobNotInitialized: 'This job is not in the Initialized state.',
          JobNotTimedOut: 'This job is not timed out.',
          JobQueueNotFound: 'This job queue not found.',

          // pool errors
          PoolNotStarted: 'This pool as not started yet.',
          PoolUnderfunded: 'This pool does not have enough funds.',

          // node errors
          NodeUnqualifiedUnstaked: "This nodes' stake has been unstaked.",
          NodeUnqualifiedStakeAmount: 'This node has not staked enough tokens.',

          // anchor errors
          Solana8ByteConstraint: '8 byte discriminator did not match what was expected',
          SolanaAccountNotInitialized: 'The program expected this account to be already initialized',
        },
      };

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
      global.metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

      // public keys
      global.nosID = new PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
      global.signers = { job: Keypair.generate() };
      global.cancelJob = Keypair.generate();

      // public keys
      global.accounts = {
        // programs
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        stakingProgram: global.stakingProgram.programId,
        rewardsProgram: global.rewardsProgram.programId,

        // sys vars
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,

        // main user
        authority: global.provider.wallet.publicKey,
        feePayer: global.provider.wallet.publicKey,

        // token
        mint: undefined,

        // token accounts
        vault: undefined,
        tokenAccount: undefined,
        user: undefined,

        // staking specific
        settings: undefined,
        stake: undefined,

        // rewards specific
        stats: undefined,
        reward: undefined,
        rewardsVault: undefined,
        rewardsStats: undefined,

        // pools specific
        pool: undefined,
        beneficiary: undefined,

        // jobs specific
        job: global.signers.job.publicKey,
        project: undefined,
        nft: undefined,
        metadata: undefined,
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
      global.nftConfig = {
        uri: 'https://arweave.net/123',
        name: 'Burner Phone NFT',
        symbol: 'NOS-NFT',
        sellerFeeBasisPoints: 0,
        collection: new PublicKey('mxAC93BiaqQ6RrzaMpGD6QotuTd8gUTSJ9sCPkyJmHT'),
      };

      // dynamic values
      global.total = { xnos: new BN(0), reflection: new BN(0), rate: global.constants.initialRate };
      global.users = { user1: null, user2: null, user3: null, user4: null, otherUsers: null };
      global.nodes = { node1: null, node2: null, otherNodes: null };
      global.stats = { staking: undefined, rewards: undefined };
      global.balances = { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0 };
    });
  });
}

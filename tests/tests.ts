// imports
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
    this.global = {
      provider: provider,
      connection: connection,
      wallet: wallet,

      // @ts-ignore
      payer: wallet.payer as anchor.web3.Signer,
      jobsProgram: anchor.workspace.NosanaJobs as anchor.Program<NosanaJobs>,
      stakingProgram: anchor.workspace.NosanaStaking as anchor.Program<NosanaStaking>,
      rewardsProgram: anchor.workspace.NosanaRewards as anchor.Program<NosanaRewards>,
      metaplex: Metaplex.make(connection).use(walletOrGuestIdentity(wallet)),

      nosID: new anchor.web3.PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP'),
      ipfsData: [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')],

      // Jobs account for the tests.
      signers: {
        jobs: anchor.web3.Keypair.generate(),
        job: anchor.web3.Keypair.generate(),
      },
      cancelJob: anchor.web3.Keypair.generate(),
      cancelJobs: anchor.web3.Keypair.generate(),

      nftConfig: {
        uri: 'https://arweave.net/123',
        name: 'Test NFT',
        symbol: 'NOS-NFT',
        sellerFeeBasisPoints: 0,
        collection: {
          verified: false,
          key: anchor.web3.Keypair.generate().publicKey,
        },
      },

      // public keys
      accounts: {
        // program ids
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        stakingProgram: anchor.workspace.NosanaStaking.programId,

        // sys vars
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

        // main user
        authority: provider.wallet.publicKey,
        feePayer: provider.wallet.publicKey,

        // Solana accounts for ci/cd and staking
        jobs: undefined,
        job: undefined,
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
      },

      global: { xnos: new anchor.BN(0), reflection: new anchor.BN(0), rate: c.initialRate },

      users: { user1: null, user2: null, user3: null, user4: null, otherUsers: null },
      nodes: { node1: null, node2: null, otherNodes: null },

      ata: {
        user: undefined,
        userVault: undefined,
        vaultJob: undefined,
        userVaultStaking: undefined,
        vaultRewards: undefined,
        nft: undefined,
      },

      stats: { staking: undefined, rewards: undefined },
      balances: { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0 },
    };

    this.global.accounts.jobs = this.global.signers.jobs.publicKey;
    this.global.accounts.job = this.global.signers.job.publicKey;
  });

  describe('initialization', initTests.bind(this));
  describe('staking', stakingTests.bind(this));
  describe('rewards', rewardTests.bind(this));
  describe('jobs', jobTests.bind(this));
});

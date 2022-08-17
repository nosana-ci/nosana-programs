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

describe('Nosana SPL', () => {
  // provider and program
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const wallet = provider.wallet;
  // @ts-ignore
  const payer = wallet.payer as anchor.web3.Signer;
  const jobsProgram = anchor.workspace.NosanaJobs as anchor.Program<NosanaJobs>;
  const stakingProgram = anchor.workspace.NosanaStaking as anchor.Program<NosanaStaking>;
  const rewardsProgram = anchor.workspace.NosanaRewards as anchor.Program<NosanaRewards>;
  const metaplex = Metaplex.make(connection).use(walletOrGuestIdentity(wallet));

  // globals variables
  const nosID = new anchor.web3.PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
  const ipfsData = [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')];

  // time
  const allowedClockDelta = 2000;
  const secondsPerDay = 24 * 60 * 60;
  const stakeDurationMin = 14 * secondsPerDay;
  const stakeDurationMax = 365 * secondsPerDay;

  // tokens
  const decimals = 1e6;
  const mintSupply = 1e7 * decimals;
  const userSupply = 1e5 * decimals;
  const jobPrice = decimals;
  const stakeAmount = 1e4 * decimals;
  const stakeMinimum = decimals;
  const slashAmount = 1e3 * decimals;
  const minimumNodeStake = 1e4 * decimals;
  const feeAmount = 1e5 * decimals;

  // rate
  let rate = new anchor.BN(1e15);

  // setup users and nodes
  const users = _.map(new Array(10), () => {
    return utils.setupSolanaUser(connection);
  });
  const [user1, user2, user3, user4] = users;
  const nodes = _.map(new Array(10), () => {
    return utils.setupSolanaUser(connection);
  });
  const [node1, node2, ...otherNodes] = nodes;

  // Jobs account for the tests.
  const signers = {
    jobs: anchor.web3.Keypair.generate(),
    job: anchor.web3.Keypair.generate(),
  };
  const cancelJob = anchor.web3.Keypair.generate();
  const cancelJobs = anchor.web3.Keypair.generate();

  const collection = anchor.web3.Keypair.generate().publicKey;
  const nftConfig = {
    uri: 'https://arweave.net/123',
    name: 'Test NFT',
    symbol: 'NOS-NFT',
    sellerFeeBasisPoints: 0,
    collection: {
      verified: false,
      key: collection,
    },
  };

  // public keys
  const accounts = {
    // program ids
    systemProgram: anchor.web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    stakingProgram: stakingProgram.programId,

    // sys vars
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

    // main user
    authority: provider.wallet.publicKey,
    feePayer: provider.wallet.publicKey,

    // Solana accounts for ci/cd and staking
    jobs: signers.jobs.publicKey,
    job: signers.job.publicKey,
    stake: undefined,
    reward: undefined,

    // token and ATAs (tbd)
    tokenAccount: undefined,
    mint: undefined,
    ataVault: undefined,
    vault: undefined,
    stats: undefined,
    settings: undefined,
    ataFrom: undefined,
    ataTo: undefined,
    user: undefined,
    ataNft: undefined,
  };

  // status options for jobs
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  };

  const errors = {
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

    // node errors
    NodeUnqualifiedUnstaked: "This nodes' stake has been unstaked.",
    NodeUnqualifiedStakeAmount: 'This node has not staked enough tokens.',

    // anchor errors
    SolanaSeedsConstraint: 'A seeds constraint was violated',
    SolanaRawConstraint: 'A raw constraint was violated',
    SolanaHasOneConstraint: 'A has one constraint was violated',
    Solana8ByteConstraint: '8 byte discriminator did not match what was expected',
    SolanaSignature: 'Signature verification failed',
    SolanaOwnerConstraint: 'An owner constraint was violated',
    SolanaAccountNotInitialized: 'The program expected this account to be already initialized',
  };

  // we'll set these later
  let mint, claimTime;
  let totalXnos = new anchor.BN(0),
    totalReflection = new anchor.BN(0);
  const ata = {
    user: undefined,
    userVault: undefined,
    vaultJob: undefined,
    userVaultStaking: undefined,
    vaultRewards: undefined,
    nft: undefined,
  };
  const stats = { staking: undefined, rewards: undefined };
  const balances = { user: 0, vaultJob: 0, vaultStaking: 0, vaultRewards: 0 };

  // helper
  async function updateRewards(stakePubkey, statsPubkey, fee = new anchor.BN(0), reflection = new anchor.BN(0)) {
    const stakeAccount = await stakingProgram.account.stakeAccount.fetch(stakePubkey);
    const statsAccount = await rewardsProgram.account.statsAccount.fetch(statsPubkey);

    let amount = 0;
    if (!reflection.eqn(0)) {
      amount = reflection.div(rate).sub(stakeAccount.xnos).toNumber();
      totalXnos.isub(stakeAccount.xnos);
      totalReflection.isub(reflection);
    }

    if (!fee.eqn(0)) {
      totalXnos.iadd(fee);
      rate = totalReflection.div(totalXnos);
    } else {
      totalXnos.iadd(stakeAccount.xnos);
      totalReflection.iadd(stakeAccount.xnos.mul(rate));
    }

    console.log(`           ==> Total Xnos: ${totalXnos}, Total Reflection: ${totalReflection}, Rate: ${rate}`);

    expect(statsAccount.totalXnos.toString()).to.equal(totalXnos.toString(), 'Total XNOS error');
    expect(statsAccount.totalReflection.toString()).to.equal(totalReflection.toString(), 'Total reflection error');
    expect(statsAccount.rate.toString()).to.equal(rate.toString(), 'Rate error');

    return amount;
  }

  /*
    INITIALIZATION SECTION
   */
  describe('Initialization of mints and ATAs', () => {
    it('Mint $NOS', async () => {
      // create mint
      accounts.mint = mint = await utils.mintFromFile(nosID.toString(), provider, provider.wallet.publicKey);
      // get ATA and bumps of the vaults
      [ata.vaultJob] = await anchor.web3.PublicKey.findProgramAddress([mint.toBuffer()], jobsProgram.programId);
      [ata.userVaultStaking] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode('vault'), mint.toBuffer(), provider.wallet.publicKey.toBuffer()],
        stakingProgram.programId
      );
      [ata.vaultRewards] = await anchor.web3.PublicKey.findProgramAddress([mint.toBuffer()], rewardsProgram.programId);
      [stats.staking] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode('settings')],
        stakingProgram.programId
      );
      [stats.rewards] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode('stats')],
        rewardsProgram.programId
      );
      [accounts.stake] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode('stake'), mint.toBuffer(), provider.wallet.publicKey.toBuffer()],
        stakingProgram.programId
      );
      [accounts.reward] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode('reward'), provider.wallet.publicKey.toBuffer()],
        rewardsProgram.programId
      );
      expect(nosID.toString()).to.equal(mint.toString());
    });

    it('Create users ATAs and mint NOS tokens', async () => {
      // create associated token accounts
      ata.user =
        accounts.ataFrom =
        accounts.ataTo =
        accounts.user =
        accounts.tokenAccount =
          await createAssociatedTokenAccount(provider.connection, payer, mint, provider.wallet.publicKey);
      // fund users
      await utils.mintToAccount(provider, mint, ata.user, mintSupply);
      await Promise.all(
        users.map(async (u) => {
          await connection.confirmTransaction(
            await connection.requestAirdrop(u.publicKey, anchor.web3.LAMPORTS_PER_SOL)
          );
          u.ata = await utils.getOrCreateAssociatedSPL(u.provider, u.publicKey, mint);
          await utils.mintToAccount(provider, mint, u.ata, userSupply);
          u.balance = userSupply;
          [u.stake] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('stake'), mint.toBuffer(), u.publicKey.toBuffer()],
            stakingProgram.programId
          );
          [u.vault] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('vault'), mint.toBuffer(), u.publicKey.toBuffer()],
            stakingProgram.programId
          );
        })
      );
      await Promise.all(
        nodes.map(async (n) => {
          await connection.confirmTransaction(
            await connection.requestAirdrop(n.publicKey, anchor.web3.LAMPORTS_PER_SOL)
          );
          n.ata = await utils.getOrCreateAssociatedSPL(n.provider, n.publicKey, mint);
          await utils.mintToAccount(provider, mint, n.ata, userSupply);
          n.balance = userSupply;
          [n.stake] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('stake'), mint.toBuffer(), n.publicKey.toBuffer()],
            stakingProgram.programId
          );
          [n.vault] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('vault'), mint.toBuffer(), n.publicKey.toBuffer()],
            stakingProgram.programId
          );
          [n.reward] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('reward'), n.publicKey.toBuffer()],
            rewardsProgram.programId
          );
        })
      );
      balances.user += mintSupply;
    });

    it('Mint NFTs', async () => {
      const { nft } = await metaplex.nfts().create(nftConfig);
      accounts.ataNft = await getAssociatedTokenAddress(nft.mint, wallet.publicKey);
      expect(await utils.getTokenBalance(provider, accounts.ataNft)).to.equal(1);

      await Promise.all(
        nodes.map(async (n) => {
          const { nft } = await metaplex.nfts().create(nftConfig);
          n.ataNft = await utils.getOrCreateAssociatedSPL(n.provider, n.publicKey, nft.mint);
          await transfer(
            connection,
            payer,
            await getAssociatedTokenAddress(nft.mint, wallet.publicKey),
            n.ataNft,
            payer,
            1
          );

          expect(await utils.getTokenBalance(provider, n.ataNft)).to.equal(1);
          expect(nft.name).to.equal(nftConfig.name);
          expect(nft.collection.key.toString()).to.equal(collection.toString());
        })
      );
    });
  });

  /*
    NOSANA STAKING SECTION
   */
  describe('Nosana Staking Instructions:', () => {
    beforeEach(() => {
      accounts.vault = ata.userVaultStaking;
    });

    describe('init()', async () => {
      it('Initialize the staking vault', async () => {
        accounts.settings = stats.staking;
        await stakingProgram.methods.init().accounts(accounts).rpc();
        await utils.assertBalancesStaking(provider, ata, balances);
      });
    });

    describe('stake()', async () => {
      it('Stake too short', async () => {
        let msg = '';
        await stakingProgram.methods
          .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMin - 1))
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeDurationTooShort);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Stake too long', async () => {
        let msg = '';
        await stakingProgram.methods
          .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMax + 1))
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeDurationTooLong);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Stake too less', async () => {
        let msg = '';
        await stakingProgram.methods
          .stake(new anchor.BN(stakeMinimum - 1), new anchor.BN(stakeDurationMax))
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeAmountNotEnough);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Stake minimum', async () => {
        await stakingProgram.methods
          .stake(new anchor.BN(stakeMinimum), new anchor.BN(stakeDurationMin))
          .accounts(accounts)
          .rpc();

        // test balances
        balances.user -= stakeMinimum;
        balances.vaultStaking += stakeMinimum;
        await utils.assertBalancesStaking(provider, ata, balances);

        // test staking account
        const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(stake.amount.toNumber()).to.equal(stakeMinimum, 'amount');
        expect(stake.vault.toString()).to.equal(accounts.vault.toString(), 'vault');
        expect(stake.authority.toString()).to.equal(accounts.authority.toString(), 'authority');
        expect(stake.duration.toNumber()).to.equal(stakeDurationMin, 'duration');
        expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(stakeDurationMin, stakeMinimum), 'xnos');
      });

      it('Stake maximum', async () => {
        await stakingProgram.methods
          .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMax))
          .accounts({
            ...accounts,
            user: user4.ata,
            authority: user4.publicKey,
            stake: user4.stake,
            vault: user4.vault,
          })
          .signers([user4.user])
          .rpc();
        user4.balance -= stakeAmount;
        balances.vaultStaking += stakeAmount;
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Stake for node 1, not enough for jobs', async () => {
        let amount = minimumNodeStake - 1;
        await stakingProgram.methods
          .stake(new anchor.BN(amount), new anchor.BN(stakeDurationMin))
          .accounts({
            ...accounts,
            user: node1.ata,
            authority: node1.publicKey,
            stake: node1.stake,
            vault: node1.vault,
          })
          .signers([node1.user])
          .rpc();
        node1.balance -= amount;
        balances.vaultStaking += amount;
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Stake for node 2, and unstake', async () => {
        await stakingProgram.methods
          .stake(new anchor.BN(minimumNodeStake), new anchor.BN(stakeDurationMin))
          .accounts({
            ...accounts,
            user: node2.ata,
            authority: node2.publicKey,
            stake: node2.stake,
            vault: node2.vault,
          })
          .signers([node2.user])
          .rpc();
        await stakingProgram.methods
          .unstake()
          .accounts({
            ...accounts,
            authority: node2.publicKey,
            reward: node2.reward,
            stake: node2.stake,
          })
          .signers([node2.user])
          .rpc();
        node2.balance -= minimumNodeStake;
        balances.vaultStaking += minimumNodeStake;
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Stake for other nodes', async () => {
        await Promise.all(
          otherNodes.map(async (n) => {
            await stakingProgram.methods
              .stake(new anchor.BN(stakeAmount * 2), new anchor.BN(3 * stakeDurationMin))
              .accounts({
                ...accounts,
                user: n.ata,
                authority: n.publicKey,
                stake: n.stake,
                vault: n.vault,
              })
              .signers([n.user])
              .rpc();
            balances.vaultStaking += stakeAmount * 2;
            n.balance -= stakeAmount * 2;
            expect(await utils.getTokenBalance(provider, n.ata)).to.equal(n.balance);
          })
        );
        await utils.assertBalancesStaking(provider, ata, balances);
      });
    });

    describe('extend()', async () => {
      it('Extend a stake with negative duration', async () => {
        const accountBefore = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        await stakingProgram.methods.extend(new anchor.BN(-7)).accounts(accounts).rpc();
        const accountAfter = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
      });

      it('Extend a stake too long', async () => {
        let msg = '';
        await stakingProgram.methods
          .extend(new anchor.BN(stakeDurationMax))
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeDurationTooLong);
      });

      it('Extend a stake', async () => {
        await stakingProgram.methods.extend(new anchor.BN(stakeDurationMin)).accounts(accounts).rpc();

        // check stake
        const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(stake.duration.toNumber()).to.equal(stakeDurationMin * 2 + 7);
        expect(stake.amount.toNumber()).to.equal(stakeMinimum);
        expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(stakeDurationMin * 2 + 7, stakeMinimum), 'xnos');
      });
    });

    describe('unstake()', async () => {
      it('Unstake from other account', async () => {
        let msg = '';
        await stakingProgram.methods
          .unstake()
          .accounts({ ...accounts, authority: user3.publicKey })
          .signers([user3.user])
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.Unauthorized);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Can not unstake with invalid reward account', async () => {
        let msg = '';
        await stakingProgram.methods
          .unstake()
          .accounts({
            ...accounts,
            reward: anchor.web3.Keypair.generate().publicKey,
          })
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeDoesNotMatchReward);

        await stakingProgram.methods
          .unstake()
          .accounts({
            ...accounts,
            reward: accounts.stake,
          })
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeHasReward);
      });

      it('Can unstake', async () => {
        await stakingProgram.methods.unstake().accounts(accounts).rpc();
        const data = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 2);
        await utils.assertBalancesStaking(provider, ata, balances);

        // check stake
        const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(stake.xnos.toNumber()).to.equal(0);
      });
    });

    describe('topup(), restake()', async () => {
      it('Topup after unstake', async () => {
        let msg = '';
        await stakingProgram.methods
          .topup(new anchor.BN(stakeAmount))
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeAlreadyUnstaked);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Restake', async () => {
        await stakingProgram.methods.restake().accounts(accounts).rpc();
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Topup', async () => {
        await stakingProgram.methods.topup(new anchor.BN(stakeAmount)).accounts(accounts).rpc();
        balances.user -= stakeAmount;
        balances.vaultStaking += stakeAmount;
        await utils.assertBalancesStaking(provider, ata, balances);

        // check stake
        const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(stake.duration.toNumber()).to.equal(stakeDurationMin * 2 + 7, 'duration');
        expect(stake.amount.toNumber()).to.equal(stakeMinimum + stakeAmount, 'amount');
        expect(stake.xnos.toNumber()).to.equal(
          utils.calculateXnos(stakeDurationMin * 2 + 7, stakeMinimum + stakeAmount),
          'xnos'
        );
      });
    });

    describe('claim()', async () => {
      it('Claim before unstake', async () => {
        let msg = '';
        await stakingProgram.methods
          .claim()
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeNotUnstaked);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Claim after too soon unstake', async () => {
        await stakingProgram.methods.unstake().accounts(accounts).rpc();
        let msg = '';
        await stakingProgram.methods
          .claim()
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeLocked);
        await utils.assertBalancesStaking(provider, ata, balances);
        await stakingProgram.methods.restake().accounts(accounts).rpc();
      });

      //
      //  To run this test you will have to modify claim.rs and change stake.duration to 5 seconds:
      //
      //          constraint = stake.time_unstake + i64::try_from(5).unwrap() <
      //                                                          ^
      /*
      it('Claim after unstake duration', async () => {
        let balanceBefore = await utils.getTokenBalance(provider, node2.ata);
        await utils.sleep(5000);
        await stakingProgram.methods
          .claim()
          .accounts({
            ...accounts,
            user: node2.ata,
            stake: node2.stake,
            authority: node2.publicKey,
            vault: node2.vault,
          })
          .signers([node2.user])
          .rpc();
        let balanceAfter = await utils.getTokenBalance(provider, node2.ata);
        expect(balanceAfter).to.equal(balanceBefore + stakeAmount);
      });
      */
    });

    describe('slash(), update_authority()', async () => {
      it('Slash', async () => {
        const stakeBefore = await stakingProgram.account.stakeAccount.fetch(nodes[2].stake);

        await stakingProgram.methods
          .slash(new anchor.BN(slashAmount))
          .accounts({ ...accounts, stake: nodes[2].stake, vault: nodes[2].vault })
          .rpc();

        balances.user += slashAmount;
        balances.vaultStaking -= slashAmount;
        await utils.assertBalancesStaking(provider, ata, balances);
        const stakeAfter = await stakingProgram.account.stakeAccount.fetch(nodes[2].stake);
        expect(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - slashAmount);
      });

      it('Slash unauthorized', async () => {
        let msg = '';
        await stakingProgram.methods
          .slash(new anchor.BN(slashAmount))
          .accounts({ ...accounts, authority: node1.publicKey })
          .signers([node1.user])
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.Unauthorized);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Slash unauthorized hack 2', async () => {
        let msg = '';
        await stakingProgram.methods
          .slash(new anchor.BN(slashAmount))
          .accounts({ ...accounts, settings: accounts.stake })
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.Solana8ByteConstraint);
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Update slash authority to node 1', async () => {
        await stakingProgram.methods
          .updateAuthority()
          .accounts({ ...accounts, newAuthority: node1.publicKey })
          .rpc();
        const stats = await stakingProgram.account.settingsAccount.fetch(accounts.settings);
        expect(stats.authority.toString()).to.equal(node1.publicKey.toString());
      });

      it('Slash with Node 1', async () => {
        await stakingProgram.methods
          .slash(new anchor.BN(slashAmount))
          .accounts({
            ...accounts,
            stake: nodes[2].stake,
            authority: node1.publicKey,
            vault: nodes[2].vault,
          })
          .signers([node1.user])
          .rpc();

        balances.user += slashAmount;
        balances.vaultStaking -= slashAmount;
        await utils.assertBalancesStaking(provider, ata, balances);
      });

      it('Update settings authority back', async () => {
        await stakingProgram.methods
          .updateAuthority()
          .accounts({ ...accounts, authority: node1.publicKey, newAuthority: accounts.authority })
          .signers([node1.user])
          .rpc();
        const stats = await stakingProgram.account.settingsAccount.fetch(accounts.settings);
        expect(stats.authority.toString()).to.equal(accounts.authority.toString());
      });
    });
  });

  /*
    NOSANA REWARDS SECTION
   */
  describe('Nosana Rewards Instructions:', () => {
    describe('init()', async () => {
      it('Initialize the rewards vault', async () => {
        accounts.stats = stats.rewards;
        accounts.vault = ata.vaultRewards;
        await rewardsProgram.methods.init().accounts(accounts).rpc();
        const data = await rewardsProgram.account.statsAccount.fetch(accounts.stats);
        expect(data.totalXnos.toString()).to.equal(totalXnos.toString());
        expect(data.totalReflection.toString()).to.equal(totalReflection.toString());
        expect(data.rate.toString()).to.equal(rate.toString());
        await utils.assertBalancesRewards(provider, ata, balances);
      });
    });

    describe('enter()', async () => {
      it('Enter rewards pool with other stake', async () => {
        let msg = '';
        await rewardsProgram.methods
          .enter()
          .accounts({ ...accounts, stake: node1.stake })
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.Unauthorized);
      });

      it('Enter rewards pool with main wallet', async () => {
        await rewardsProgram.methods.enter().accounts(accounts).rpc();
        await updateRewards(accounts.stake, accounts.stats);
      });

      it('Can not unstake while reward is open', async () => {
        let msg = '';
        await stakingProgram.methods
          .unstake()
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.StakeHasReward);
      });

      it('Enter rewards with the other nodes', async () => {
        for (const node of otherNodes) {
          await rewardsProgram.methods
            .enter()
            .accounts({ ...accounts, stake: node.stake, reward: node.reward, authority: node.publicKey })
            .signers([node.user])
            .rpc();
          await updateRewards(node.stake, accounts.stats);
        }
      });
    });

    describe('add_fee()', async () => {
      it('Add fees to the pool', async () => {
        await rewardsProgram.methods.addFee(new anchor.BN(feeAmount)).accounts(accounts).rpc();
        await updateRewards(accounts.stake, accounts.stats, new anchor.BN(feeAmount));
        balances.user -= feeAmount;
        balances.vaultRewards += feeAmount;
        await utils.assertBalancesRewards(provider, ata, balances);
      });
    });

    describe('claim()', async () => {
      it('Claim rewards', async () => {
        const reflection = (await rewardsProgram.account.rewardAccount.fetch(accounts.reward)).reflection;
        await rewardsProgram.methods.claim().accounts(accounts).rpc();
        const amount = await updateRewards(accounts.stake, accounts.stats, new anchor.BN(0), reflection);
        balances.user += amount;
        balances.vaultRewards -= amount;
        await utils.assertBalancesRewards(provider, ata, balances);
      });

      it('Claim other rewards', async () => {
        for (const node of otherNodes) {
          const reflection = (await rewardsProgram.account.rewardAccount.fetch(node.reward)).reflection;
          await rewardsProgram.methods
            .claim()
            .accounts({
              ...accounts,
              stake: node.stake,
              reward: node.reward,
              authority: node.publicKey,
              user: node.ata,
            })
            .signers([node.user])
            .rpc();
          const amount = await updateRewards(node.stake, accounts.stats, new anchor.BN(0), reflection);
          node.balance += amount;
          balances.vaultRewards -= amount;
          await utils.assertBalancesRewards(provider, ata, balances);
        }
        expect(await utils.getTokenBalance(provider, ata.vaultRewards)).to.be.closeTo(0, 100, 'vault is empty');
      });
    });

    describe('sync()', async () => {
      it('Add more fees to the pool', async () => {
        await rewardsProgram.methods.addFee(new anchor.BN(feeAmount)).accounts(accounts).rpc();
        await updateRewards(accounts.stake, accounts.stats, new anchor.BN(feeAmount));
        balances.user -= feeAmount;
        balances.vaultRewards += feeAmount;
        await utils.assertBalancesRewards(provider, ata, balances);
      });

      it('Topup stake', async () => {
        await stakingProgram.methods
          .topup(new anchor.BN(stakeAmount))
          .accounts({ ...accounts, vault: ata.userVaultStaking })
          .rpc();
        balances.user -= stakeAmount;
        balances.vaultStaking += stakeAmount;
        await utils.assertBalancesStaking(provider, ata, balances);
        expect((await stakingProgram.account.stakeAccount.fetch(accounts.stake)).xnos.toNumber()).to.equal(
          utils.calculateXnos(stakeDurationMin * 2 + 7, stakeAmount * 2 + stakeMinimum)
        );
      });

      it('Sync reward reflection for wrong accounts', async () => {
        let msg = '';
        await rewardsProgram.methods
          .sync()
          .accounts({ ...accounts, reward: nodes[4].reward })
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.SolanaRawConstraint);
      });

      it('Sync reward reflection', async () => {
        const before = await rewardsProgram.account.rewardAccount.fetch(accounts.reward);
        await rewardsProgram.methods.sync().accounts(accounts).rpc();
        const after = await rewardsProgram.account.rewardAccount.fetch(accounts.reward);
        const stake = (await stakingProgram.account.stakeAccount.fetch(accounts.stake)).xnos.toNumber();

        expect(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
        expect(after.xnos.toNumber()).to.equal(stake);
        expect(after.xnos.toNumber()).to.equal(
          utils.calculateXnos(stakeDurationMin * 2 + 7, stakeAmount * 2 + stakeMinimum)
        );

        totalXnos.iadd(after.xnos.sub(before.xnos));
        totalReflection.isub(before.reflection);
        const reflection = after.xnos.add(before.reflection.div(new anchor.BN(rate)).sub(before.xnos)).mul(rate);
        totalReflection.iadd(reflection);

        expect(reflection.toString()).to.equal(after.reflection.toString());

        const rewardsAccount = await rewardsProgram.account.statsAccount.fetch(stats.rewards);

        expect(rewardsAccount.totalXnos.toString()).to.equal(totalXnos.toString(), 'Total XNOS error');
        expect(rewardsAccount.totalReflection.toString()).to.equal(
          totalReflection.toString(),
          'Total reflection error'
        );
        expect(rewardsAccount.rate.toString()).to.equal(rate.toString(), 'Rate error');
      });

      it('Add another round of fees to the pool', async () => {
        await rewardsProgram.methods.addFee(new anchor.BN(feeAmount)).accounts(accounts).rpc();
        await updateRewards(accounts.stake, accounts.stats, new anchor.BN(feeAmount));
        balances.user -= feeAmount;
        balances.vaultRewards += feeAmount;
        await utils.assertBalancesRewards(provider, ata, balances);
      });

      it('Sync reward reflection for others', async () => {
        for (const node of otherNodes) {
          const before = await rewardsProgram.account.rewardAccount.fetch(node.reward);
          await rewardsProgram.methods
            .sync()
            .accounts({ ...accounts, stake: node.stake, reward: node.reward })
            .rpc();
          const after = await rewardsProgram.account.rewardAccount.fetch(node.reward);
          const stake = await stakingProgram.account.stakeAccount.fetch(node.stake);
          expect(before.xnos.toNumber()).to.equal(after.xnos.toNumber());
          expect(stake.xnos.toNumber()).to.equal(after.xnos.toNumber());
        }
      });
    });

    describe('close()', async () => {
      it('Close reward account', async () => {
        await rewardsProgram.methods.close().accounts(accounts).rpc();
        await utils.assertBalancesRewards(provider, ata, balances);
      });

      it('Can unstake after reward is closed', async () => {
        let stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(stake.timeUnstake.toNumber()).to.equal(0);
        await stakingProgram.methods.unstake().accounts(accounts).rpc();
        stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
        expect(stake.timeUnstake.toNumber()).to.not.equal(0);
        await stakingProgram.methods.restake().accounts(accounts).rpc();
      });

      it('Close other accounts', async () => {
        for (const node of otherNodes) {
          await rewardsProgram.methods
            .close()
            .accounts({
              ...accounts,
              reward: node.reward,
              stake: node.stake,
              authority: node.publicKey,
            })
            .signers([node.user])
            .rpc();
        }
      });
    });
  });

  /*
    NOSANA JOBS SECTION
   */
  describe('Nosana Jobs Instructions:', () => {
    describe('init_vault()', async () => {
      it('Initialize the jobs vault', async () => {
        accounts.ataVault = ata.vaultJob;
        await jobsProgram.methods.initVault().accounts(accounts).rpc();
        await utils.assertBalancesJobs(provider, ata, balances);
      });
    });

    describe('init_propject()', async () => {
      it('Initialize project', async () => {
        await jobsProgram.methods.initProject().accounts(accounts).signers([signers.jobs]).rpc();
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Initialize project for other users', async () => {
        await Promise.all(
          users.map(async (u) => {
            await jobsProgram.methods
              .initProject()
              .accounts({
                ...accounts,
                authority: u.publicKey,
                jobs: u.signers.jobs.publicKey,
              })
              .signers([u.user, u.signers.jobs])
              .rpc();
          })
        );
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Fetch project', async () => {
        const data = await jobsProgram.account.jobs.fetch(accounts.jobs);
        expect(data.authority.toString()).to.equal(accounts.authority.toString());
        expect(data.jobs.length).to.equal(0);
      });
    });

    describe('create_job()', async () => {
      it('Create job', async () => {
        await jobsProgram.methods
          .createJob(new anchor.BN(jobPrice), ipfsData)
          .accounts(accounts)
          .signers([signers.job])
          .rpc();
        balances.user -= jobPrice;
        balances.vaultJob += jobPrice;
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Create job in different ata', async () => {
        let msg = '';
        const tempJob = anchor.web3.Keypair.generate();
        await jobsProgram.methods
          .createJob(new anchor.BN(jobPrice), ipfsData)
          .accounts({
            ...accounts,
            ataVault: accounts.ataFrom,
            job: tempJob.publicKey,
          })
          .signers([tempJob])
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal('A seeds constraint was violated');
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Create job for other users', async () => {
        await Promise.all(
          users.map(async (u) => {
            await jobsProgram.methods
              .createJob(new anchor.BN(jobPrice), ipfsData)
              .accounts({
                ...accounts,
                jobs: u.signers.jobs.publicKey,
                job: u.signers.job.publicKey,
                ataFrom: u.ata,
                authority: u.publicKey,
              })
              .signers([u.user, u.signers.job])
              .rpc();
            // update balances
            balances.vaultJob += jobPrice;
            u.balance -= jobPrice;
          })
        );
        await Promise.all(
          users.map(async (u) => {
            expect(await utils.getTokenBalance(provider, u.ata)).to.equal(u.balance);
          })
        );
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      /*
      // create
      it('Create max jobs', async () => {
        for (let i = 0; i < 10; i++) {
          console.log(i);
          let job = anchor.web3.Keypair.generate();
          await program.rpc.createJob(
            bump,
            new anchor.BN(jobPrice),
            ipfsData,
            {
              accounts: {
                ...accounts,
                job: job.publicKey,
              }, signers: [job]});
          balances.user -= jobPrice
          balances.vault += jobPrice
        }

        // tests
        await utils.assertBalancesJobs(provider, ata, balances)
      });
      */

      it('Fetch job', async () => {
        const data = await jobsProgram.account.job.fetch(accounts.job);
        expect(data.jobStatus).to.equal(jobStatus.created);
        expect(utils.buf2hex(new Uint8Array(data.ipfsJob))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));
      });
    });

    describe('claim_job()', async () => {
      it('Claim job', async () => {
        await jobsProgram.methods.claimJob().accounts(accounts).rpc();
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Claim job that is already claimed', async () => {
        let msg = '';
        await jobsProgram.methods
          .claimJob()
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.JobNotInitialized);
      });

      it('Claim job for all other nodes and users', async () => {
        claimTime = new Date();
        await Promise.all(
          [...Array(10).keys()].map(async (i) => {
            let user = users[i];
            let node = nodes[i];

            // store these temporary to get them easier later
            node.job = user.signers.job.publicKey;
            node.jobs = user.signers.jobs.publicKey;

            let msg = '';
            await jobsProgram.methods
              .claimJob()
              .accounts({
                ...accounts,
                authority: node.publicKey,
                stake: node.stake,
                job: node.job,
                jobs: node.jobs,
                ataNft: node.ataNft,
              })
              .signers([node.user])
              .rpc()
              .catch((e) => (msg = e.error.errorMessage));

            if (i === 0) expect(msg).to.equal(errors.NodeUnqualifiedStakeAmount);
            else if (i === 1) expect(msg).to.equal(errors.NodeUnqualifiedUnstaked);
            else expect(msg).to.equal('');
          })
        );
      });

      it('Fetch claimed job', async () => {
        const data = await jobsProgram.account.job.fetch(accounts.job);
        expect(claimTime / 1e3).to.be.closeTo(data.timeStart.toNumber(), allowedClockDelta, 'times differ too much');
        expect(data.jobStatus).to.equal(jobStatus.claimed);
        expect(data.node.toString()).to.equal(provider.wallet.publicKey.toString());
        expect(data.tokens.toString()).to.equal(jobPrice.toString());
      });
    });

    describe('reclaim_job()', async () => {
      it('Reclaim job too soon', async () => {
        let msg = '';
        await jobsProgram.methods
          .reclaimJob()
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.JobNotTimedOut);
      });
    });

    describe('finish_job()', async () => {
      it('Finish job from other node', async () => {
        let msg = '';
        await jobsProgram.methods
          .finishJob(ipfsData)
          .accounts({
            ...accounts,
            authority: user2.publicKey,
          })
          .signers([user2.user])
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.Unauthorized);
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Finish job', async () => {
        await jobsProgram.methods.finishJob(ipfsData).accounts(accounts).rpc();
        balances.user += jobPrice;
        balances.vaultJob -= jobPrice;
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Finish job that is already finished', async () => {
        let msg = '';
        await jobsProgram.methods
          .finishJob(ipfsData)
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.JobNotClaimed);
      });

      it('Finish job for all nodes', async () => {
        await Promise.all(
          otherNodes.map(async (n) => {
            await jobsProgram.methods
              .finishJob(ipfsData)
              .accounts({
                ...accounts,
                job: n.job,
                ataTo: n.ata,
                authority: n.publicKey,
              })
              .signers([n.user])
              .rpc();
            // update balances
            balances.vaultJob -= jobPrice;
            n.balance += jobPrice;
            expect(await utils.getTokenBalance(provider, n.ata)).to.equal(n.balance);
          })
        );
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Fetch finished job', async () => {
        const dataJobs = await jobsProgram.account.jobs.fetch(accounts.jobs);
        const dataJob = await jobsProgram.account.job.fetch(accounts.job);

        expect(claimTime / 1e3).to.be.closeTo(dataJob.timeEnd.toNumber(), allowedClockDelta);
        expect(dataJob.jobStatus).to.equal(jobStatus.finished, 'job status does not match');
        expect(dataJobs.jobs.length).to.equal(0, 'number of jobs do not match');
        expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));

        await Promise.all(
          otherNodes.map(async (n) => {
            const dataJobs = await jobsProgram.account.jobs.fetch(n.jobs);
            const dataJob = await jobsProgram.account.job.fetch(n.job);

            expect(dataJob.jobStatus).to.equal(jobStatus.finished);
            expect(dataJobs.jobs.length).to.equal(0);
            expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));
          })
        );
      });
    });

    describe('close_job()', async () => {
      it('Close job', async () => {
        const lamport_before = await connection.getBalance(accounts.authority);
        await jobsProgram.methods.closeJob().accounts(accounts).rpc();
        const lamport_after = await connection.getBalance(accounts.authority);
        expect(lamport_before).to.be.lessThan(lamport_after);
      });

      it('Fetch closed Job', async () => {
        let msg = '';
        await jobsProgram.methods
          .finishJob(ipfsData)
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.SolanaAccountNotInitialized);
      });
    });

    describe('cancel_job()', async () => {
      it('Create new job and new project', async () => {
        accounts.job = cancelJob.publicKey;

        await jobsProgram.methods
          .createJob(new anchor.BN(jobPrice), ipfsData)
          .accounts(accounts)
          .signers([cancelJob])
          .rpc();

        await jobsProgram.methods
          .initProject()
          .accounts({ ...accounts, jobs: cancelJobs.publicKey })
          .signers([cancelJobs])
          .rpc();

        balances.user -= jobPrice;
        balances.vaultJob += jobPrice;
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Cancel job in wrong queue', async () => {
        let msg = '';
        await jobsProgram.methods
          .cancelJob()
          .accounts({ ...accounts, jobs: cancelJobs.publicKey })
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.JobQueueNotFound);
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Cancel job from other user', async () => {
        let msg = '';
        await jobsProgram.methods
          .cancelJob()
          .accounts({ ...accounts, authority: user1.publicKey })
          .signers([user1.user])
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.Unauthorized);
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Cancel job', async () => {
        await jobsProgram.methods.cancelJob().accounts(accounts).rpc();
        balances.user += jobPrice;
        balances.vaultJob -= jobPrice;
        await utils.assertBalancesJobs(provider, ata, balances);
      });

      it('Cancel job in wrong state', async () => {
        let msg = '';
        await jobsProgram.methods
          .cancelJob()
          .accounts(accounts)
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));
        expect(msg).to.equal(errors.JobNotInitialized);
        await utils.assertBalancesJobs(provider, ata, balances);
      });
    });
  });
});

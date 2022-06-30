// imports
import * as anchor from '@project-serum/anchor';
import * as _ from 'lodash';
import * as utils from './utils';
import { expect } from 'chai';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccount } from '@solana/spl-token';
import { NosanaStaking } from '../target/types/nosana_staking';
import { NosanaJobs } from '../target/types/nosana_jobs';

describe('Nosana SPL', () => {
  // provider and program
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const jobsProgram = anchor.workspace.NosanaJobs as anchor.Program<NosanaJobs>;
  const stakingProgram = anchor.workspace.NosanaStaking as anchor.Program<NosanaStaking>;

  // globals variables
  const nosID = new anchor.web3.PublicKey('testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp');
  const ipfsData = [...Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex')];

  // time
  const allowedClockDelta = 2000;
  const secondsPerMonth = (365 * 24 * 60 * 60) / 12;
  const stakeDurationMonth = secondsPerMonth;
  const stakeDurationYear = 12 * secondsPerMonth;

  // tokens
  const decimals = 1e6;
  const mintSupply = 1e7 * decimals;
  const userSupply = 1e4 * decimals;
  const jobPrice = decimals;
  const stakeAmount = 1e3 * decimals;

  // setup users and nodes
  const users = _.map(new Array(10), () => {
    return utils.setupSolanaUser(connection);
  });
  const [user1, user2, user3, user4, ...otherUsers] = users;
  const nodes = _.map(new Array(10), () => {
    return utils.setupSolanaUser(connection);
  });

  // Jobs account for the tests.
  const signers = {
    jobs: anchor.web3.Keypair.generate(),
    job: anchor.web3.Keypair.generate(),
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

    // token and ATAs (tbd)
    mint: undefined,
    ataVault: undefined,
    ataFrom: undefined,
    ataTo: undefined,
  };

  // status options for jobs
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  };

  const errors = {
    JobNotClaimed: 'NosanaError::JobNotClaimed - Job is not in the Claimed state.',
    JobNotInitialized: 'NosanaError::JobNotInitialized - Job is not in the Initialized state.',
    JobNotTimedOut: 'NosanaError::JobNotTimedOut - Job is not timed out.',
    JobQueueNotFound: 'NosanaError::JobQueueNotFound - Job queue not found.',

    StakeAmountNotEnough: 'NosanaError::StakeAmountNotEnough - This amount is not enough.',
    StakeAlreadyInitialized: 'NosanaError::StakeAlreadyInitialized - This stake is already running.',
    StakeAlreadyStaked: 'NosanaError::StakeAlreadyStaked - This stake is already unstaked.',
    StakeAlreadyUnstaked: 'NosanaError::StakeAlreadyUnstaked - This stake is already unstaked.',
    StakeLocked: 'NosanaError::StakeLocked - This stake is still locked.',
    StakeDurationTooShort: 'NosanaError::StakeDurationTooShort - This stake duration is not long enough.',
    StakeDurationTooLong: 'NosanaError::StakeDurationTooLong - This stake duration is too long.',

    Unauthorized: 'NosanaError::Unauthorized - You are not authorized to perform this action.',
  };

  // we'll set these later
  let mint, bumpJobs, bumpStaking, claimTime, unstakeTime;
  const ata = { user: undefined, vaultJob: undefined, vaultStaking: undefined };
  const balances = { user: 0, vaultJob: 0, vaultStaking: 0 };

  // for later
  let cancelJob = anchor.web3.Keypair.generate();
  let cancelJobs = anchor.web3.Keypair.generate();

  describe('Initialization', () => {
    it('Mint $NOS', async () => {
      // create mint
      accounts.mint = mint = await utils.mintFromFile(nosID.toString(), provider, provider.wallet.publicKey);
      // get ATA and bumps of the vaults
      [ata.vaultJob, bumpJobs] = await anchor.web3.PublicKey.findProgramAddress(
        [mint.toBuffer()],
        jobsProgram.programId
      );
      [ata.vaultStaking, bumpStaking] = await anchor.web3.PublicKey.findProgramAddress(
        [mint.toBuffer()],
        stakingProgram.programId
      );
      [accounts.stake] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode('stake'), provider.wallet.publicKey.toBuffer()],
        stakingProgram.programId
      );
      expect(nosID.toString()).to.equal(mint.toString());
    });

    it(`Create users, ATAs for Nosana tokens, and mint ${mintSupply / decimals} tokens`, async () => {
      // create associated token accounts
      accounts.ataFrom =
        accounts.ataTo =
        ata.user =
          await createAssociatedTokenAccount(
            provider.connection,
            // @ts-ignore
            provider.wallet.payer, // ts complains about the payer not existing
            mint,
            provider.wallet.publicKey
          );
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
            [anchor.utils.bytes.utf8.encode('stake'), u.publicKey.toBuffer()],
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
          n.balance = 0;
          [n.stake] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('stake'), n.publicKey.toBuffer()],
            stakingProgram.programId
          );
        })
      );
      balances.user += mintSupply;
    });
  });

  /*
    NOSANA STAKING SECTION
   */
  describe('Nosana Staking', () => {
    it('Initialize the staking vault', async () => {
      accounts.ataVault = ata.vaultStaking;
      await stakingProgram.methods.initVault(bumpJobs).accounts(accounts).rpc();
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Create stake too short', async () => {
      let msg = '';
      await stakingProgram.methods
        .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMonth - 1))
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.StakeDurationTooShort);
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Create stake too long', async () => {
      let msg = '';
      await stakingProgram.methods
        .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationYear + 1))
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.StakeDurationTooLong);
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Create stake minimum', async () => {
      await stakingProgram.methods
        .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMonth))
        .accounts(accounts)
        .rpc();
      balances.user -= stakeAmount;
      balances.vaultStaking += stakeAmount;
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Create stake maximum', async () => {
      await stakingProgram.methods
        .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationYear))
        .accounts({
          ...accounts,
          ataFrom: user4.ata,
          authority: user4.publicKey,
          stake: user4.stake,
        })
        .signers([user4.user])
        .rpc();
      user4.balance -= stakeAmount;
      balances.vaultStaking += stakeAmount;
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Initialize stake for other users', async () => {
      await Promise.all(
        otherUsers.map(async (u) => {
          await stakingProgram.methods
            .stake(new anchor.BN(stakeAmount), new anchor.BN(3 * stakeDurationMonth))
            .accounts({
              ...accounts,
              ataFrom: u.ata,
              authority: u.publicKey,
              stake: u.stake,
            })
            .signers([u.user])
            .rpc();
          balances.vaultStaking += stakeAmount;
          u.balance -= stakeAmount;
          expect(await utils.getTokenBalance(provider, u.ata)).to.equal(u.balance);
        })
      );
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Emit rank', async () => {
      const result = await stakingProgram.methods.emitRank().accounts(accounts).simulate();
      const rank = result.events[0].data;
      const xnos = parseInt(rank.xnos.toString());
      expect(xnos).to.equal(utils.calculateXnos(0, Date.now(), stakeDurationMonth, stakeAmount));
      await utils.assertBalancesStaking(provider, ata, balances);
    });

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

    it('Top Up', async () => {
      await stakingProgram.methods.topup(new anchor.BN(stakeAmount)).accounts(accounts).rpc();
      balances.user -= stakeAmount;
      balances.vaultStaking += stakeAmount;
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Unstake', async () => {
      await stakingProgram.methods.unstake().accounts(accounts).rpc();
      const data = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
      expect(Date.now() / 1e3 - data.timeUnstake.toNumber()).to.be.closeTo(0, 2);
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Top Up after unstake', async () => {
      let msg = '';
      await stakingProgram.methods
        .topup(new anchor.BN(stakeAmount))
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.StakeAlreadyUnstaked);
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Re-stake', async () => {
      await stakingProgram.methods.restake().accounts(accounts).rpc();
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Top Up again', async () => {
      await stakingProgram.methods.topup(new anchor.BN(stakeAmount)).accounts(accounts).rpc();
      balances.user -= stakeAmount;
      balances.vaultStaking += stakeAmount;
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Unstake second time', async () => {
      await stakingProgram.methods.unstake().accounts(accounts).rpc();
      const data = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
      expect(Date.now() / 1e3 - data.timeUnstake.toNumber()).to.be.closeTo(0, 2);
      unstakeTime = data.timeUnstake.toNumber();
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Unstake for other users', async () => {
      await Promise.all(
        otherUsers.map(async (u) => {
          await stakingProgram.methods
            .unstake()
            .accounts({
              ...accounts,
              authority: u.publicKey,
              stake: u.stake,
            })
            .signers([u.user])
            .rpc();
          expect(await utils.getTokenBalance(provider, u.ata)).to.equal(u.balance);
        })
      );
      await utils.assertBalancesStaking(provider, ata, balances);
    });

    it('Check that xnos decreases after unstake', async () => {
      await utils.sleep(3000);
      const result = await stakingProgram.methods.emitRank().accounts(accounts).simulate();
      const data = result.events[0].data;
      const rank = { xnos: 0, amount: 0, duration: 0, timeUnstake: 0 };
      for (const type of Object.keys(rank)) rank[type] = parseInt(data[type].toString());

      const userStake = stakeAmount * 3; // stake + topup + topup
      const xnos = utils.calculateXnos(unstakeTime, Date.now() / 1e3, stakeDurationMonth, userStake);
      expect(rank.amount).to.equal(userStake);
      expect(rank.duration).to.equal(stakeDurationMonth);
      expect(rank.timeUnstake).to.be.closeTo(unstakeTime, 1);
      expect(rank.xnos).to.be.lessThan(utils.calculateXnos(0, 1, stakeDurationMonth, userStake));
      expect(rank.xnos).to.be.closeTo(xnos, 1000);
    });
  });

  /*
    NOSANA JOBS SECTION
   */
  describe('Nosana Jobs', () => {
    it('Initialize the jobs vault', async () => {
      accounts.ataVault = ata.vaultJob;
      await jobsProgram.methods.initVault(bumpJobs).accounts(accounts).rpc();
      await utils.assertBalancesJobs(provider, ata, balances);
    });

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

    it('Create jobs for other users', async () => {
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

    it('List jobs', async () => {
      const data = await jobsProgram.account.jobs.fetch(accounts.jobs);
      expect(data.authority.toString()).to.equal(accounts.authority.toString());
      expect(data.jobs[0].toString()).to.equal(accounts.job.toString());
      expect(data.jobs.length).to.equal(1);
    });

    it('Check if job is created', async () => {
      const data = await jobsProgram.account.job.fetch(accounts.job);
      expect(data.jobStatus).to.equal(jobStatus.created);
      expect(utils.buf2hex(new Uint8Array(data.ipfsJob))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));
    });

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

    it('Reclaim job too soon', async () => {
      let msg = '';
      await jobsProgram.methods
        .reclaimJob()
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.JobNotTimedOut);
    });

    it('Claim jobs for all other nodes and users', async () => {
      claimTime = new Date();
      await Promise.all(
        [...Array(10).keys()].map(async (i) => {
          let user = users[i];
          let node = nodes[i];

          // store these temporary to get them easier later
          node.job = user.signers.job.publicKey;
          node.jobs = user.signers.jobs.publicKey;

          await jobsProgram.methods
            .claimJob()
            .accounts({
              ...accounts,
              authority: node.publicKey,
              job: node.job,
              jobs: node.jobs,
            })
            .signers([node.user])
            .rpc();
        })
      );
    });

    it('Check if job is claimed', async () => {
      const data = await jobsProgram.account.job.fetch(accounts.job);
      expect(utils.timeDelta(data.timeStart, claimTime)).to.be.closeTo(0, allowedClockDelta, 'times differ too much');
      expect(data.jobStatus).to.equal(jobStatus.claimed);
      expect(data.node.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(data.tokens.toString()).to.equal(jobPrice.toString());
    });

    it('Finish job from other node', async () => {
      let msg = '';
      await jobsProgram.methods
        .finishJob(bumpJobs, ipfsData)
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
      await jobsProgram.methods.finishJob(bumpJobs, ipfsData).accounts(accounts).rpc();
      balances.user += jobPrice;
      balances.vaultJob -= jobPrice;
      await utils.assertBalancesJobs(provider, ata, balances);
    });

    it('Finish job that is already finished', async () => {
      let msg = '';
      await jobsProgram.methods
        .finishJob(bumpJobs, ipfsData)
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.JobNotClaimed);
    });

    it('Finish job for all nodes', async () => {
      await Promise.all(
        nodes.map(async (n) => {
          await jobsProgram.methods
            .finishJob(bumpJobs, ipfsData)
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

    it('Check if job is finished', async () => {
      const dataJobs = await jobsProgram.account.jobs.fetch(accounts.jobs);
      const dataJob = await jobsProgram.account.job.fetch(accounts.job);

      expect(utils.timeDelta(dataJob.timeEnd, claimTime)).to.be.closeTo(0, allowedClockDelta);
      expect(dataJob.jobStatus).to.equal(jobStatus.finished);
      expect(dataJobs.jobs.length).to.equal(0);
      expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));

      await Promise.all(
        nodes.map(async (n) => {
          const dataJobs = await jobsProgram.account.jobs.fetch(n.jobs);
          const dataJob = await jobsProgram.account.job.fetch(n.job);

          expect(dataJob.jobStatus).to.equal(jobStatus.finished);
          expect(dataJobs.jobs.length).to.equal(0);
          expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));
        })
      );
    });

    it('Close job', async () => {
      const lamport_before = await connection.getBalance(accounts.authority);
      await jobsProgram.methods.closeJob().accounts(accounts).rpc();
      const lamport_after = await connection.getBalance(accounts.authority);
      expect(lamport_before).to.be.lessThan(lamport_after);
    });

    it('Check that Job account does not exist anymore', async () => {
      let msg = '';
      await jobsProgram.methods
        .finishJob(bumpJobs, ipfsData)
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal('The program expected this account to be already initialized');
    });

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
        .cancelJob(bumpJobs)
        .accounts({ ...accounts, jobs: cancelJobs.publicKey })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.JobQueueNotFound);
      await utils.assertBalancesJobs(provider, ata, balances);
    });

    it('Cancel job from other user', async () => {
      let msg = '';
      await jobsProgram.methods
        .cancelJob(bumpJobs)
        .accounts({ ...accounts, authority: user1.publicKey })
        .signers([user1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.Unauthorized);
      await utils.assertBalancesJobs(provider, ata, balances);
    });

    it('Cancel job', async () => {
      await jobsProgram.methods.cancelJob(bumpJobs).accounts(accounts).rpc();
      balances.user += jobPrice;
      balances.vaultJob -= jobPrice;
      await utils.assertBalancesJobs(provider, ata, balances);
    });

    it('Cancel job in wrong state', async () => {
      let msg = '';
      await jobsProgram.methods
        .cancelJob(bumpJobs)
        .accounts(accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(errors.JobNotInitialized);
      await utils.assertBalancesJobs(provider, ata, balances);
    });
  });
});

// imports
const anchor = require('@project-serum/anchor');
const _ = require('lodash')
const {TOKEN_PROGRAM_ID, createAssociatedTokenAccount} = require('@solana/spl-token');
const utils = require('./utils');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

describe('Nosana SPL', () => {

  // provider and program
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const jobsProgram = anchor.workspace.NosanaJobs;
  const stakingProgram = anchor.workspace.NosanaStaking;

  // globals variables
  const nosID = new anchor.web3.PublicKey('testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp');
  const ipfsData = Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex');

  // time
  const allowedClockDelta = 2000;
  const secondsPerDay = 24 * 60 * 60;
  const stakeMinDuration = 90 * secondsPerDay;
  const stakeMaxDuration = 4 * stakeMinDuration;
  const timeDiv = secondsPerDay;

  const stakeRanks = {
    level0: 0,
    level1: 1e3 * 1e6 * stakeMinDuration / timeDiv,
    level2: 1e4 * 1e6 * stakeMinDuration * 2 / timeDiv,
    level3: 1e5 * 1e6 * stakeMinDuration * 3 / timeDiv,
    level4: 1e6 * 1e6 * stakeMaxDuration / timeDiv,
  }

  function get_rank(xnos) {
    switch (true) {
      case xnos >= stakeRanks.level4: return 4
      case xnos >= stakeRanks.level3: return 3
      case xnos >= stakeRanks.level2: return 2
      case xnos >= stakeRanks.level1: return 1
      case xnos >= stakeRanks.level0: return 0
      default: return -1
    }
  }

  // tokens
  const decimals = 1e6
  const mintSupply = 1e7 * decimals;
  const userSupply = 1e2 * decimals;
  const jobPrice = decimals;
  const stakeAmount = 1e3 * decimals;

  // setup users and nodes
  const users = _.map(new Array(10), () => {
    return utils.setupSolanaUser(connection)
  });
  const [user1, user2, user3, user4, ...otherUsers] = users
  const nodes = _.map(new Array(10), () => {
    return utils.setupSolanaUser(connection)
  });

  // Jobs account for the tests.
  const signers = {
    jobs: anchor.web3.Keypair.generate(),
    job: anchor.web3.Keypair.generate(),
    stake: anchor.web3.Keypair.generate(),
  }

  // public keys
  const accounts = {
    systemProgram: anchor.web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

    authority: provider.wallet.publicKey,
    feePayer: provider.wallet.publicKey,
  }

  const jobAccounts = {
    ...accounts,
    jobs: signers.jobs.publicKey,
    job: signers.job.publicKey,
  }

  const stakingAccounts = {
    ...accounts,
    stake: signers.stake.publicKey,
  }

  // status options for jobs
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  }

  const errors = {
    Unauthorized: 'NosanaError::Unauthorized - You are not authorized to perform this action.',

    StakeAmountNotEnough: 'NosanaError::StakeAmountNotEnough - This amount is not enough.',
    StakeAlreadyInitialized: 'NosanaError::StakeAlreadyInitialized - This stake is already running.',
    StakeAlreadyStaked: 'NosanaError::StakeAlreadyStaked - This stake is already unstaked.',
    StakeAlreadyUnstaked: 'NosanaError::StakeAlreadyUnstaked - This stake is already unstaked.',
    StakeLocked: 'NosanaError::StakeLocked - This stake is still locked.',
    StakeDurationTooShort: 'NosanaError::StakeDurationTooShort - This duration is not long enough.',
    StakeDurationTooLong: 'NosanaError::StakeDurationTooLong - This duration is too long.',

    JobNotClaimed: 'NosanaError::JobNotClaimed - Job is not in the Claimed state.',
    JobNotInitialized: 'NosanaError::JobNotInitialized - Job is not in the Initialized state.',
    JobNotTimedOut: 'NosanaError::JobNotTimedOut - Job is not timed out.',
    JobQueueNotFound: 'NosanaError::JobQueueNotFound - Job queue not found.',
  }

  // we'll set these later
  let mint, bumpJobs, bumpStaking, time;
  const ata = {user: '', vaultJob: '', vaultStaking: ''}
  const balances = {user: 0, vaultJob: 0, vaultStaking: 0}

  // for later
  let cancelJob = anchor.web3.Keypair.generate()
  let cancelJobs = anchor.web3.Keypair.generate()

  describe('Initialization', () => {

    // mint
    it('Mint $NOS', async () => {

      // create the main token
      jobAccounts.mint = stakingAccounts.mint = mint = await utils.mintFromFile(nosID.toString(), provider, provider.wallet.publicKey);

      // get ATA of the vault, and the bump
      [ata.vaultJob, bumpJobs] = await anchor.web3.PublicKey.findProgramAddress(
        [mint.toBuffer()],
        jobsProgram.programId
      );
      jobAccounts.ataVault = ata.vaultJob;

      [ata.vaultStaking, bumpStaking] = await anchor.web3.PublicKey.findProgramAddress(
        [mint.toBuffer()],
        stakingProgram.programId
      );
      stakingAccounts.ataVault = ata.vaultStaking;

      // tests
      assert.strictEqual(nosID.toString(), mint.toString());
    });

    // mint
    it(`Create users, ATAs for Nosana tokens, and mint ${mintSupply / decimals} tokens`, async () => {

      // create associated token accounts
      stakingAccounts.ataFrom = jobAccounts.ataFrom = stakingAccounts.ataTo = jobAccounts.ataTo = ata.user =
        await createAssociatedTokenAccount(
          provider.connection,
          provider.wallet.payer,
          mint,
          provider.wallet.publicKey,
        );

      // mint tokens
      await utils.mintToAccount(provider, mint, ata.user, mintSupply);

      await Promise.all(users.map(async u => {
        await connection.confirmTransaction(await connection.requestAirdrop(u.publicKey, anchor.web3.LAMPORTS_PER_SOL))
        u.ata = await utils.getOrCreateAssociatedSPL(u.provider, u.publicKey, mint);
        await utils.mintToAccount(provider, mint, u.ata, userSupply);
        u.balance = userSupply
      }))

      await Promise.all(nodes.map(async n => {
        await connection.confirmTransaction(await connection.requestAirdrop(n.publicKey, anchor.web3.LAMPORTS_PER_SOL))
        n.ata = await utils.getOrCreateAssociatedSPL(n.provider, n.publicKey, mint);
        n.balance = 0
      }))

      // tests
      balances.user += mintSupply
    });
  });

  /*
    NOSANA STAKING SECTION
   */
  describe('Nosana Staking', () => {

    it('Initialize the staking vault', async () => {
      await stakingProgram.rpc.initVault(bumpJobs, {accounts: stakingAccounts});
      await utils.assertBalancesStaking(provider, ata, balances)
    });

    // too short stake
    it('Create stake too short', async () => {
      try {
        await stakingProgram.rpc.stake(
          new anchor.BN(stakeAmount),
          new anchor.BN(stakeMinDuration - 1),
          {
            accounts: stakingAccounts,
            signers: [signers.stake],
          });
      } catch (e) {
        msg = e.error.errorMessage
      }
      expect(msg).to.be.equal(errors.StakeDurationTooShort)
      await utils.assertBalancesStaking(provider, ata, balances)
    });

    // too long stake
    it('Create stake too long', async () => {
      try {
        await stakingProgram.rpc.stake(
          new anchor.BN(stakeAmount),
          new anchor.BN(stakeMaxDuration + 1),
          {
            accounts: stakingAccounts,
            signers: [signers.stake],
          });
      } catch (e) {
        msg = e.error.errorMessage
      }

      expect(msg).to.be.equal(errors.StakeDurationTooLong)
      await utils.assertBalancesStaking(provider, ata, balances)
    });

    // min stake
    it('Create stake minimum', async () => {
      await stakingProgram.rpc.stake(
        new anchor.BN(stakeAmount),
        new anchor.BN(stakeMinDuration),
        {
          accounts: stakingAccounts,
          signers: [signers.stake],
        });
      balances.user -= stakeAmount
      balances.vaultStaking += stakeAmount
      await utils.assertBalancesStaking(provider, ata, balances)
    });

    // max stake
    it('Create stake maximum', async () => {
      const tempStake = anchor.web3.Keypair.generate()
      await stakingProgram.rpc.stake(
        new anchor.BN(stakeAmount),
        new anchor.BN(stakeMaxDuration),
        {
          accounts: {
            ...stakingAccounts,
            stake: tempStake.publicKey
          },
          signers: [tempStake],
        });
      balances.user -= stakeAmount
      balances.vaultStaking += stakeAmount
      await utils.assertBalancesStaking(provider, ata, balances)
    });

    // emit stake
    it('Emit rank', async () => {
      const result = await stakingProgram.simulate.emitRank({accounts: stakingAccounts});
      const rank = result.events[0].data
      const xnos = parseInt(rank.xnos.toString())
      const tier = rank.tier
      expect(xnos).to.be.equal(stakeMinDuration * stakeAmount / timeDiv)
      expect(tier).to.be.equal(get_rank(xnos));
      await utils.assertBalancesStaking(provider, ata, balances)
    });

  });

  /*
    NOSANA JOBS SECTION
   */
  describe('Nosana Jobs', () => {

    // initialize vaults
    it('Initialize the jobs vault', async () => {
      await jobsProgram.rpc.initVault(bumpJobs, {accounts: jobAccounts});
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // initialize project
    it('Initialize project', async () => {
      await jobsProgram.rpc.initProject({accounts: jobAccounts, signers: [signers.jobs]});
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // initialize project
    it('Initialize project for other users', async () => {
      await Promise.all(users.map(async u => {
        await jobsProgram.rpc.initProject(
          {
            accounts: {
              // account to store jobs
              jobs: u.signers.jobs.publicKey,

              // signer and payer
              authority: u.publicKey,
              feePayer: jobAccounts.feePayer,

              // required
              systemProgram: jobAccounts.systemProgram,
            },
            signers: [u.user, u.signers.jobs],
          }
        );
      }))
    });

    // create
    it('Create job', async () => {
      await jobsProgram.rpc.createJob(new anchor.BN(jobPrice), ipfsData, {
        accounts: jobAccounts,
        signers: [signers.job]
      });

      // tests
      balances.user -= jobPrice
      balances.vaultJob += jobPrice
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // create
    it('Create job in different ata', async () => {
      let msg = ''
      try {
        const tempJob = anchor.web3.Keypair.generate()
        await jobsProgram.rpc.createJob(
          new anchor.BN(jobPrice),
          ipfsData,
          {
            accounts: {
              ...jobAccounts,
              ataVault: jobAccounts.ataFrom,
              job: tempJob.publicKey,
            },
            signers: [tempJob]
          },
        );
      } catch (e) {
        msg = e.error.errorMessage
      }

      expect(msg).to.be.equal('A seeds constraint was violated')
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // create
    it('Create jobs for other users', async () => {
      await Promise.all(users.map(async u => {
        await jobsProgram.rpc.createJob(
          new anchor.BN(jobPrice),
          ipfsData,
          {
            accounts: {
              ...jobAccounts,
              // jobs
              jobs: u.signers.jobs.publicKey,
              job: u.signers.job.publicKey,
              ataFrom: u.ata,
              authority: u.publicKey,
            },
            signers: [u.user, u.signers.job],
          }
        );

        // update balances
        balances.vaultJob += jobPrice
        u.balance -= jobPrice
      }))
      await Promise.all(users.map(async u => {
        assert.strictEqual(await utils.getTokenBalance(provider, u.ata), u.balance);
      }))
      await utils.assertBalancesJobs(provider, ata, balances)
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

    // list
    it('List jobs', async () => {
      const data = await jobsProgram.account.jobs.fetch(jobAccounts.jobs);
      assert.strictEqual(data.authority.toString(), jobAccounts.authority.toString());
      assert.strictEqual(data.jobs[0].toString(), jobAccounts.job.toString());
      assert.strictEqual(data.jobs.length, 1);
    });

    // get
    it('Check if job is created', async () => {
      const data = await jobsProgram.account.job.fetch(jobAccounts.job);
      assert.strictEqual(data.jobStatus, jobStatus.created);
      assert.strictEqual(utils.buf2hex(new Uint8Array(data.ipfsJob).buffer), ipfsData.toString('hex'));
    });

    // claim
    it('Claim job', async () => {
      await jobsProgram.rpc.claimJob({accounts: jobAccounts});
    });

    // claim
    it('Claim job that is already claimed', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.claimJob({accounts: jobAccounts});
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.JobNotInitialized);
    });

    // reclaim
    it('Reclaim job too soon', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.reclaimJob({accounts: jobAccounts});
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.JobNotTimedOut);
    });

    // claim
    it('Claim jobs for all other nodes and users', async () => {
      time = new Date();
      await Promise.all([...Array(10).keys()].map(async i => {

          let user = users[i]
          let node = nodes[i]

          // store these temporary to get them easier later
          node.job = user.signers.job.publicKey
          node.jobs = user.signers.jobs.publicKey

          await jobsProgram.rpc.claimJob(
            {
              accounts: {
                authority: node.publicKey,
                job: node.job,
                jobs: node.jobs,
                clock: jobAccounts.clock,
                systemProgram: jobAccounts.systemProgram,
              },
              signers: [node.user],
            }
          )
        }
      ))
    });

    // get
    it('Check if job is claimed', async () => {
      const data = await jobsProgram.account.job.fetch(jobAccounts.job);
      expect(utils.timeDelta(data.timeStart, time)).to.be.closeTo(0, allowedClockDelta, 'times differ too much');
      assert.strictEqual(data.jobStatus, jobStatus.claimed);
      assert.strictEqual(data.node.toString(), provider.wallet.publicKey.toString());
      assert.strictEqual(data.tokens.toString(), jobPrice.toString());
    });

    // finish
    it('Finish job from other node', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.finishJob(bumpJobs, ipfsData, {
          accounts: {
            ...jobAccounts,
            authority: user4.publicKey
          },
          signers: [user4.user],
        });
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.Unauthorized);
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // finish
    it('Finish job', async () => {
      await jobsProgram.rpc.finishJob(bumpJobs, ipfsData, {accounts: jobAccounts});
      // tests
      balances.user += jobPrice
      balances.vaultJob -= jobPrice
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // finish
    it('Finish job that is already finished', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.finishJob(bumpJobs, ipfsData, {accounts: jobAccounts});
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.JobNotClaimed);
    });

    // finish
    it('Finish job for all nodes', async () => {
      await Promise.all(nodes.map(async n => {
        await jobsProgram.rpc.finishJob(
          bumpJobs,
          ipfsData,
          {
            accounts: {
              ...jobAccounts,
              job: n.job,
              jobs: n.jobs,
              ataTo: n.ata,
              authority: n.publicKey,
            },
            signers: [n.user]
          }
        );
        // update balances
        balances.vaultJob -= jobPrice
        n.balance += jobPrice
      }))
      await Promise.all(nodes.map(async n => {
        assert.strictEqual(await utils.getTokenBalance(provider, n.ata), n.balance);
      }))
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // get
    it('Check if job is finished', async () => {
      const dataJobs = await jobsProgram.account.jobs.fetch(jobAccounts.jobs);
      const dataJob = await jobsProgram.account.job.fetch(jobAccounts.job);

      expect(utils.timeDelta(dataJob.timeEnd, time)).to.be.closeTo(0, allowedClockDelta, 'times differ too much');
      assert.strictEqual(dataJob.jobStatus, jobStatus.finished);
      assert.strictEqual(dataJobs.jobs.length, 0);
      assert.strictEqual(utils.buf2hex(new Uint8Array(dataJob.ipfsResult).buffer), ipfsData.toString('hex'));

      await Promise.all(nodes.map(async n => {

        const dataJobs = await jobsProgram.account.jobs.fetch(n.jobs);
        const dataJob = await jobsProgram.account.job.fetch(n.job);

        assert.strictEqual(dataJob.jobStatus, jobStatus.finished);
        assert.strictEqual(dataJobs.jobs.length, 0);
        assert.strictEqual(utils.buf2hex(new Uint8Array(dataJob.ipfsResult).buffer), ipfsData.toString('hex'));
      }))
    });

    // close
    it('Close job', async () => {
      const lamport_before = await connection.getBalance(jobAccounts.authority);
      await jobsProgram.rpc.closeJob({accounts: jobAccounts});
      const lamport_after = await connection.getBalance(jobAccounts.authority);
      expect(lamport_before).to.be.lessThan(lamport_after);
    });

    // check that job does not exist anymore
    it('Check that Job account does not exist anymore', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.finishJob(bumpJobs, ipfsData, {accounts: jobAccounts});
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, 'The program expected this account to be already initialized');
    });

    // create
    it('Create new job and new project', async () => {
      jobAccounts.job = cancelJob.publicKey

      await jobsProgram.rpc.createJob(new anchor.BN(jobPrice), ipfsData, {accounts: jobAccounts, signers: [cancelJob]});

      await jobsProgram.rpc.initProject({
        accounts: {
          ...jobAccounts,
          jobs: cancelJobs.publicKey,
        }, signers: [cancelJobs]
      });

      // tests
      balances.user -= jobPrice
      balances.vaultJob += jobPrice
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // cancel
    it('Cancel job in wrong queue', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.cancelJob(bumpJobs, {
          accounts: {
            ...jobAccounts,
            jobs: cancelJobs.publicKey
          },
        });
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.JobQueueNotFound);
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // cancel
    it('Cancel job from other user', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.cancelJob(bumpJobs, {
          accounts: {
            ...jobAccounts,
            authority: user4.publicKey
          },
          signers: [user4.user],
        });
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.Unauthorized);
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // cancel
    it('Cancel job', async () => {
      await jobsProgram.rpc.cancelJob(bumpJobs, {accounts: jobAccounts});

      // tests
      balances.user += jobPrice
      balances.vaultJob -= jobPrice
      await utils.assertBalancesJobs(provider, ata, balances)
    });

    // cancel
    it('Cancel job in wrong state', async () => {
      let msg = ''
      try {
        await jobsProgram.rpc.cancelJob(bumpJobs, {accounts: jobAccounts});
      } catch (e) {
        msg = e.error.errorMessage
      }
      assert.strictEqual(msg, errors.JobNotInitialized);
      await utils.assertBalancesJobs(provider, ata, balances)
    });
  });

});

// imports
const anchor = require('@project-serum/anchor');
const _ = require('lodash')
const {TOKEN_PROGRAM_ID, createAssociatedTokenAccount} = require('@solana/spl-token');
const utils = require('./utils');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

describe('Nosana Jobs', () => {

  // provider and program
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const program = anchor.workspace.NosanaJobs;

  // globals variables
  const nosID = new anchor.web3.PublicKey('testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp');
  const ipfsData = Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex');
  const mintSupply = 100_000_000;
  const userSupply = 100;
  const jobPrice = 10;
  const allowedClockDelta = 2000;

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
  }

  // public keys
  const accounts = {

    systemProgram: anchor.web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

    authority: provider.wallet.publicKey,
    feePayer: provider.wallet.publicKey,

    jobs: signers.jobs.publicKey,
    job: signers.job.publicKey,
  }

  // status options for jobs
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  }

  const errors = {
    JobNotClaimed: 'NosanaError::JobNotClaimed - Job is not in the Claimed state.',
    JobNotInitialized: 'NosanaError::JobNotInitialized - Job is not in the Initialized state.',
    JobNotTimedOut: 'NosanaError::JobNotTimedOut - Job is not timed out.',
    JobQueueNotFound: 'NosanaError::JobQueueNotFound - Job queue not found.',
    Unauthorized: 'NosanaError::Unauthorized - You are not authorized to perform this action.',
  }

  // we'll set these later
  let mint, bump, time;
  const ata = {user: '', vault: ''}
  const balances = {user: 0, vault: 0}

  // for later
  let cancelJob = anchor.web3.Keypair.generate()
  let cancelJobs = anchor.web3.Keypair.generate()

  // mint
  it('Mint $NOS', async () => {

    // create the main token
    mint = await utils.mintFromFile(nosID.toString(), provider, provider.wallet.publicKey);

    // get ATA of the vault, and the bump
    [ata.vault, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [mint.toBuffer()],
      program.programId
    );

    // tests
    assert.strictEqual(nosID.toString(), mint.toString());

    accounts.mint = mint;
    accounts.ataVault = ata.vault;
  });

  // initialize vault
  it('Initialize the vault', async () => {
    await program.rpc.initVault(bump, {accounts});
  });

  // mint
  it(`Create users, ATAs for Nosana tokens, and mint ${mintSupply} tokens`, async () => {

    // create associated token accounts
    ata.user = await createAssociatedTokenAccount(
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

    accounts.ataFrom = ata.user;
    accounts.ataTo = ata.user;

    // tests
    balances.user += mintSupply
    await utils.assertBalances(provider, ata, balances)
  });

  // initialize project
  it('Initialize project', async () => {
    await program.rpc.initProject({accounts, signers: [signers.jobs]});
  });

  // initialize project
  it('Initialize project for other users', async () => {
    await Promise.all(users.map(async u => {
      await program.rpc.initProject(
        {
          accounts: {
            // account to store jobs
            jobs: u.signers.jobs.publicKey,

            // signer and payer
            authority: u.publicKey,
            feePayer: accounts.feePayer,

            // required
            systemProgram: accounts.systemProgram,
          },
          signers: [u.user, u.signers.jobs],
        }
      );
    }))
  });

  // create
  it('Create job', async () => {
    await program.rpc.createJob(new anchor.BN(jobPrice), ipfsData, {accounts, signers: [signers.job]});

    // tests
    balances.user -= jobPrice
    balances.vault += jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // create
  it('Create job in different ata', async () => {
    let msg = ''
    try {
      const tempJob = anchor.web3.Keypair.generate()
      await program.rpc.createJob(
        new anchor.BN(jobPrice),
        ipfsData,
        {
          accounts: {
            ...accounts,
            ataVault: accounts.ataFrom,
            job: tempJob.publicKey,
          },
          signers: [tempJob]
        },
      );
    } catch (e) {
      msg = e.error.errorMessage
    }

    expect(msg).to.be.equal('A seeds constraint was violated')
    await utils.assertBalances(provider, ata, balances)
  });

  // create
  it('Create jobs for other users', async () => {
    await Promise.all(users.map(async u => {
      await program.rpc.createJob(
        new anchor.BN(jobPrice),
        ipfsData,
        {
          accounts: {
            ...accounts,
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
      balances.vault += jobPrice
      u.balance -= jobPrice
    }))
    await Promise.all(users.map(async u => {
      assert.strictEqual(await utils.getTokenBalance(provider, u.ata), u.balance);
    }))
    await utils.assertBalances(provider, ata, balances)
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
    await utils.assertBalances(provider, ata, balances)
  });
  */

  // list
  it('List jobs', async () => {
    const data = await program.account.jobs.fetch(accounts.jobs);
    assert.strictEqual(data.authority.toString(), accounts.authority.toString());
    assert.strictEqual(data.jobs[0].toString(), accounts.job.toString());
    assert.strictEqual(data.jobs.length, 1);
  });

  // get
  it('Check if job is created', async () => {
    const data = await program.account.job.fetch(accounts.job);
    assert.strictEqual(data.jobStatus, jobStatus.created);
    assert.strictEqual(utils.buf2hex(new Uint8Array(data.ipfsJob).buffer), ipfsData.toString('hex'));
  });

  // claim
  it('Claim job', async () => {
    await program.rpc.claimJob({accounts});
  });

  // claim
  it('Claim job that is already claimed', async () => {
    let msg = ''
    try {
      await program.rpc.claimJob({accounts});
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, errors.JobNotInitialized);
  });

  // reclaim
  it('Reclaim job too soon', async () => {
    let msg = ''
    try {
      await program.rpc.reclaimJob({accounts});
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

        await program.rpc.claimJob(
          {
            accounts: {
              authority: node.publicKey,
              job: node.job,
              jobs: node.jobs,
              clock: accounts.clock,
              systemProgram: accounts.systemProgram,
            },
            signers: [node.user],
          }
        )
      }
    ))
  });

  // get
  it('Check if job is claimed', async () => {
    const data = await program.account.job.fetch(accounts.job);
    expect(utils.timeDelta(data.timeStart, time)).to.be.closeTo(0, allowedClockDelta, 'times differ too much');
    assert.strictEqual(data.jobStatus, jobStatus.claimed);
    assert.strictEqual(data.node.toString(), provider.wallet.publicKey.toString());
    assert.strictEqual(data.tokens.toString(), jobPrice.toString());
  });

  // finish
  it('Finish job from other node', async () => {
    let msg = ''
    try {
      await program.rpc.finishJob(bump, ipfsData, {
        accounts: {
          ...accounts,
          authority: user4.publicKey
        },
        signers: [user4.user],
      });
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, errors.Unauthorized);
    await utils.assertBalances(provider, ata, balances)
  });

  // finish
  it('Finish job', async () => {
    time = new Date();
    await program.rpc.finishJob(bump, ipfsData, {accounts});
    // tests
    balances.user += jobPrice
    balances.vault -= jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // finish
  it('Finish job that is already finished', async () => {
    let msg = ''
    try {
      await program.rpc.finishJob(bump, ipfsData, {accounts});
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, errors.JobNotClaimed);
  });

  // finish
  it('Finish job for all nodes', async () => {
    await Promise.all(nodes.map(async n => {
      await program.rpc.finishJob(
        bump,
        ipfsData,
        {
          accounts: {
            ...accounts,
            job: n.job,
            jobs: n.jobs,
            ataTo: n.ata,
            authority: n.publicKey,
          },
          signers: [n.user]
        }
      );
      // update balances
      balances.vault -= jobPrice
      n.balance += jobPrice
    }))
    await Promise.all(nodes.map(async n => {
      assert.strictEqual(await utils.getTokenBalance(provider, n.ata), n.balance);
    }))
    await utils.assertBalances(provider, ata, balances)
  });

  // get
  it('Check if job is finished', async () => {
    const dataJobs = await program.account.jobs.fetch(accounts.jobs);
    const dataJob = await program.account.job.fetch(accounts.job);

    expect(utils.timeDelta(dataJob.timeEnd, time)).to.be.closeTo(0, allowedClockDelta, 'times differ too much');
    assert.strictEqual(dataJob.jobStatus, jobStatus.finished);
    assert.strictEqual(dataJobs.jobs.length, 0);
    assert.strictEqual(utils.buf2hex(new Uint8Array(dataJob.ipfsResult).buffer), ipfsData.toString('hex'));

    await Promise.all(nodes.map(async n => {

      const dataJobs = await program.account.jobs.fetch(n.jobs);
      const dataJob = await program.account.job.fetch(n.job);

      assert.strictEqual(dataJob.jobStatus, jobStatus.finished);
      assert.strictEqual(dataJobs.jobs.length, 0);
      assert.strictEqual(utils.buf2hex(new Uint8Array(dataJob.ipfsResult).buffer), ipfsData.toString('hex'));
    }))
  });

  // close
  it('Close job', async () => {
    const lamport_before = await connection.getBalance(accounts.authority);
    await program.rpc.closeJob({accounts});
    const lamport_after = await connection.getBalance(accounts.authority);
    expect(lamport_before).to.be.lessThan(lamport_after);
  });

  // check that job does not exist anymore
  it('Check that Job account does not exist anymore', async () => {
    let msg = ''
    try {
      await program.rpc.finishJob(bump, ipfsData, {accounts});
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, 'The program expected this account to be already initialized');
  });

  // create
  it('Create new job and new project', async () => {
    accounts.job = cancelJob.publicKey

    await program.rpc.createJob(new anchor.BN(jobPrice), ipfsData, {accounts, signers: [cancelJob]});

    await program.rpc.initProject({
      accounts: {
        ...accounts,
        jobs: cancelJobs.publicKey,
      }, signers: [cancelJobs]
    });

    // tests
    balances.user -= jobPrice
    balances.vault += jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // cancel
  it('Cancel job in wrong queue', async () => {
    let msg = ''
    try {
      await program.rpc.cancelJob(bump, {
        accounts: {
          ...accounts,
          jobs: cancelJobs.publicKey
        },
      });
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, errors.JobQueueNotFound);
    await utils.assertBalances(provider, ata, balances)
  });

  // cancel
  it('Cancel job from other user', async () => {
    let msg = ''
    try {
      await program.rpc.cancelJob(bump, {
        accounts: {
          ...accounts,
          authority: user4.publicKey
        },
        signers: [user4.user],
      });
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, errors.Unauthorized);
    await utils.assertBalances(provider, ata, balances)
  });

  // cancel
  it('Cancel job', async () => {
    await program.rpc.cancelJob(bump, {accounts});

    // tests
    balances.user += jobPrice
    balances.vault -= jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // cancel
  it('Cancel job in wrong state', async () => {
    let msg = ''
    try {
      await program.rpc.cancelJob(bump, {accounts});
    } catch (e) {
      msg = e.error.errorMessage
    }
    assert.strictEqual(msg, errors.JobNotInitialized);
    await utils.assertBalances(provider, ata, balances)
  });
});

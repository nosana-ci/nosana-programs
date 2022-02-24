// imports
const anchor = require('@project-serum/anchor');
const assert = require('assert');
const {TOKEN_PROGRAM_ID} = require('@solana/spl-token');
const utils = require('./utils');
const {buf2hex} = require("./utils");

describe('jobs', () => {

  // local provider
  const provider = anchor.Provider.local();

  // program to test
  const program = anchor.workspace.Jobs;

  // globals variables
  const nosAddress = 'testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp';
  const ipfsData = Buffer.from('7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89', 'hex');
  const mintSupply = 100_000_000;
  const jobPrice = 10;

  // Jobs account for the tests.
  const signers = {
    jobs : anchor.web3.Keypair.generate(),
    job : anchor.web3.Keypair.generate(),
  }

  // public keys
  const accounts = {

    // solana native
    systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    tokenProgram: TOKEN_PROGRAM_ID,

    // custom
    user : provider.wallet.publicKey,
    jobs : signers.jobs.publicKey,
    job : signers.job.publicKey,
  }

  // status options for jobs
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  }

  // we'll set these later
  let mint, bump;
  const ata = {user: '', vault: ''}
  const balances = {user: 0, vault: 0}

  // mint
  it('Mint $NOS', async () => {

    // create the main token
    mint = await utils.mintFromFile(nosAddress, provider, provider.wallet.publicKey);

    // get ATA of the vault, and the bump
    [ata.vault, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [mint.publicKey.toBuffer()],
      program.programId
    );

    // tests
    assert.strictEqual(nosAddress, mint.publicKey.toString());
  });

  // initialize vault
  it('Initialize the vault', async () => {
    await program.rpc.initVault(
      bump,
      {
        accounts: {

          // vault parameters
          mint: mint.publicKey,
          ataVault: ata.vault,

          // signer and payer
          authority: accounts.user,

          // required
          systemProgram: accounts.systemProgram,
          tokenProgram: accounts.tokenProgram,
          rent: accounts.rent,
        }
      }
    );
  });

  // initialize project
  it('Initialize project', async () => {
    await program.rpc.initProject(
      {
        accounts: {
          // account to store jobs
          jobs: accounts.jobs,

          // signer and payer
          authority: accounts.user,

          // required
          systemProgram: accounts.systemProgram,
        },
        signers: [signers.jobs],
      }
    );
  });

  // mint
  it(`Create user ATAs for Nosana tokens, mint ${mintSupply} tokens`, async () => {

    // create associated token accounts
    ata.user = await mint.createAssociatedTokenAccount(provider.wallet.publicKey);

    // mint tokens
    await utils.mintToAccount(provider, mint.publicKey, ata.user, mintSupply);

    // tests
    balances.user += mintSupply
    await utils.assertBalances(provider, ata, balances)
  });

  // create
  it('Create job', async () => {
    await program.rpc.createJob(
      bump,
      new anchor.BN(jobPrice),
      ipfsData,
      {
        accounts: {

          // jobs
          jobs: accounts.jobs,
          job: accounts.job,

          // payment
          mint: mint.publicKey,
          ataVault: ata.vault,
          ataFrom: ata.user,

          // signer
          authority: accounts.user,

          // required
          systemProgram: accounts.systemProgram,
          tokenProgram: accounts.tokenProgram,
        },
        signers: [signers.job],
      }
    );

    // tests
    balances.user -= jobPrice
    balances.vault += jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // list
  it('List jobs', async () => {
    const data = await program.account.jobs.fetch(accounts.jobs);
    assert.strictEqual(data.authority.toString(), accounts.user.toString());
    assert.strictEqual(data.jobs[0].toString(), accounts.job.toString());
    assert.strictEqual(data.jobs.length, 1);
  });

  // get
  it('Check if job is created', async () => {
    const data = await program.account.job.fetch(accounts.job);
    assert.strictEqual(data.jobStatus, jobStatus.created);
    assert.strictEqual(buf2hex(new Uint8Array(data.ipfsJob).buffer), ipfsData.toString('hex'));
  });

  // claim
  it('Claim job', async () => {
    await program.rpc.claimJob(
      {
        accounts: {
          authority: provider.wallet.publicKey,
          job: accounts.job,
          systemProgram: accounts.systemProgram,
        },
      }
    );
  });

  // get
  it('Check if job is claimed', async () => {
    const data = await program.account.job.fetch(accounts.job);
    assert.strictEqual(data.jobStatus, jobStatus.claimed);
    assert.strictEqual(data.node.toString(), provider.wallet.publicKey.toString());
    assert.strictEqual(data.tokens.toString(), jobPrice.toString());

  });

  // finish
  it('Finish job', async () => {
    await program.rpc.finishJob(
      bump,
      ipfsData,
      {
        accounts: {

          //jobs
          job: accounts.job,
          jobs: accounts.jobs,

          // token and ATAs
          mint: mint.publicKey,
          ataVault: ata.vault,
          ataTo: ata.user,

          // signer
          authority: accounts.user,

          // required
          systemProgram: accounts.systemProgram,
          tokenProgram: accounts.tokenProgram,
        },
      }
    );
    // tests
    balances.user += jobPrice
    balances.vault -= jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // get
  it('Check if job is finished', async () => {
    const dataJobs = await program.account.jobs.fetch(accounts.jobs);
    const dataJob = await program.account.job.fetch(accounts.job);

    assert.strictEqual(dataJob.jobStatus, jobStatus.finished);
    assert.strictEqual(dataJobs.jobs.length, 0);
    assert.strictEqual(buf2hex(new Uint8Array(dataJob.ipfsResult).buffer), ipfsData.toString('hex'));
  });
});

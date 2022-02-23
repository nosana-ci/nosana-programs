// imports
const anchor = require('@project-serum/anchor');
const assert = require('assert');
const {TOKEN_PROGRAM_ID} = require('@solana/spl-token');
const utils = require('./utils');

describe('jobs', () => {

  // local provider
  const provider = anchor.Provider.local();

  // program to test
  const program = anchor.workspace.Jobs;

  // globals variables
  const nosAddress = 'testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp';
  const mintSupply = 100_000_000;
  const jobPrice = 5_000_000;

  // we'll set these later
  let nosMint, bump;
  const ata = {user: '', vault: ''}
  const spl = {nos: '', vault: program.programId}
  const balances = {user: 0, vault: 0}

  // Jobs account for the tests.
  const jobs = anchor.web3.Keypair.generate();
  const job = anchor.web3.Keypair.generate();

  // status options for jobs
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  }

  // initialize
  it('Mint $nos', async () => {

    // create the main token
    nosMint = await utils.mintFromFile(nosAddress, provider, provider.wallet.publicKey);

    // get token address, and compare to file
    spl.nos = nosMint.publicKey;

    // get ATA of the vault, and the bump
    [ata.vault, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [spl.nos.toBuffer()],
      spl.vault
    );

    // tests
    assert.strictEqual(nosAddress, spl.nos.toString());
  });

  // initialize
  it('Initialize the vault', async () => {

    // initialize
    await program.rpc.initVault(
      bump,
      {
        accounts: {
          // signer
          authority: provider.wallet.publicKey,

          // token program
          nos: spl.nos,
          vault: ata.vault,

          // required
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }
      }
    );
  });

  // initialize
  it('Initialize project', async () => {

    // initialize
    await program.rpc.initProject(
      {
        accounts: {
          project: provider.wallet.publicKey,
          jobs: jobs.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [jobs],
      }
    );
  });

  // mint
  it(`Create user ATAs for Nosana tokens, mint ${mintSupply} tokens`, async () => {

    // create associated token accounts
    ata.user = await nosMint.createAssociatedTokenAccount(provider.wallet.publicKey);

    // mint tokens
    await utils.mintToAccount(provider, nosMint.publicKey, ata.user, mintSupply);

    // tests
    balances.user += mintSupply
    await utils.assertBalances(provider, ata, balances)
  });

  // create
  it('Create job', async () => {

    // create the main token
    await program.rpc.createJob(
      bump,
      new anchor.BN(jobPrice),
      {
        accounts: {
          project: provider.wallet.publicKey,

          // jobs
          jobs: jobs.publicKey,
          job: job.publicKey,

          // payment
          nos: spl.nos,
          vault: ata.vault,
          nosFrom: ata.user,

          // required
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [job],
      }
    );

    // tests
    balances.user -= jobPrice
    balances.vault += jobPrice
    await utils.assertBalances(provider, ata, balances)
  });

  // list
  it('List jobs', async () => {
    const dataJobs = await program.account.jobs.fetch(jobs.publicKey);
    assert.strictEqual(dataJobs.project.toString(), provider.wallet.publicKey.toString());
    assert.strictEqual(dataJobs.jobs[0].toString(), job.publicKey.toString());
    assert.strictEqual(dataJobs.jobs.length, 1);
  });

  // get
  it('Check if job is created', async () => {
    const data = await program.account.job.fetch(job.publicKey);
    assert.strictEqual(data.jobStatus, jobStatus.created);
  });

  // claim
  it('Claim job', async () => {

    // create the main token
    await program.rpc.claimJob(
      {
        accounts: {
          node: provider.wallet.publicKey,
          job: job.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      }
    );
  });

  // get
  it('Check if job is claimed', async () => {
    const data = await program.account.job.fetch(job.publicKey);

    assert.strictEqual(data.jobStatus, jobStatus.claimed);
    assert.strictEqual(data.node.toString(), provider.wallet.publicKey.toString());
    assert.strictEqual(data.tokens.toString(), jobPrice.toString());

  });
  // claim
  it('Finish job', async () => {

    // create the main token
    await program.rpc.finishJob(
      bump,
      {
        accounts: {
          //jobs
          node: provider.wallet.publicKey,
          job: job.publicKey,
          jobs: jobs.publicKey,
          project: provider.wallet.publicKey,

          // token and ATAs
          nos: spl.nos,
          vault: ata.vault,
          tokenTo: ata.user,

          // required
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
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
    const dataJobs = await program.account.jobs.fetch(jobs.publicKey);
    const dataJob = await program.account.job.fetch(job.publicKey);

    assert.strictEqual(dataJob.jobStatus, jobStatus.finished);
    assert.strictEqual(dataJobs.jobs.length, 0);
  });
});

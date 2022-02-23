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

  // Jobs account for the tests.
  const jobs = anchor.web3.Keypair.generate();
  const job = anchor.web3.Keypair.generate();

  // globals variables
  const addressTokens = 'testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp';
  const mintSupply = 100_000_000;
  const jobPrice = 5_000_000;

  //
  const jobStatus = {
    created: 0,
    claimed: 1,
    finished: 2,
  }
  // we'll set these later
  let mintTokens, bump;

  const wallets = {user: '', vault: ''}
  const spl = {nos: '', vault: ''}
  const balances = {user: 0, vault: 0}

  // initialize
  it('Initialize project', async () => {

    // create the main token
    mintTokens = await utils.mintFromFile(addressTokens, provider, provider.wallet.publicKey);
    assert.strictEqual(addressTokens, mintTokens.publicKey.toString());
    [wallets.vault, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [mintTokens.publicKey.toBuffer()],
      program.programId
    );

    // set spl for later
    spl.nos = mintTokens.publicKey;
    spl.vault = wallets.vault;

    // initialize
    await program.rpc.initializeProject(
      bump,
      {
        accounts: {
          authority: provider.wallet.publicKey,
          jobs: jobs.publicKey,

          nos: spl.nos,
          vault: wallets.vault,

          // required
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [jobs],
      }
    );
  });

  // mint
  it(`Create user ATAs for Nosana tokens, mint ${mintSupply} tokens`, async () => {

    // create associated token accounts
    wallets.user = await mintTokens.createAssociatedTokenAccount(provider.wallet.publicKey);

    // mint tokens
    await utils.mintToAccount(provider, mintTokens.publicKey, wallets.user, mintSupply);

    // tests
    balances.user += mintSupply
    await utils.assertBalances(provider, wallets, balances)
  });

  // create
  it('Create job', async () => {

    // create the main token
    await program.rpc.createJob(
      bump,
      new anchor.BN(jobPrice),
      {
        accounts: {
          authority: provider.wallet.publicKey,

          // jobs
          jobs: jobs.publicKey,
          job: job.publicKey,

          // payment
          nos: spl.nos,
          vault: wallets.vault,
          nosFrom: wallets.user,

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
    await utils.assertBalances(provider, wallets, balances)
  });

  // list
  it('List jobs', async () => {
    const data = await program.account.jobs.fetch(jobs.publicKey);
    assert.strictEqual(data.authority.toString(), provider.wallet.publicKey.toString());
    assert.strictEqual(data.jobs[0].toString(), job.publicKey.toString());
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
      bump,
      {
        accounts: {
          authority: provider.wallet.publicKey,
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
          authority: provider.wallet.publicKey,
          job: job.publicKey,

          // wallets
          nos: spl.nos,
          vault: wallets.vault,
          tokenTo: wallets.user,

          // required
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    // tests
    balances.user += jobPrice
    balances.vault -= jobPrice
    await utils.assertBalances(provider, wallets, balances)
  });

  // get
  it('Check if job is finished', async () => {
    const data = await program.account.job.fetch(job.publicKey);
    assert.strictEqual(data.jobStatus, jobStatus.finished);
  });
});

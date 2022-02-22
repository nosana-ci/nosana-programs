// imports
const anchor = require('@project-serum/anchor');
const assert = require('assert');
const {TOKEN_PROGRAM_ID} = require('@solana/spl-token');
const utils = require('./utils');

describe('staking', () => {

  // local provider
  const provider = anchor.Provider.local();

  // program to test
  const program = anchor.workspace.Jobs;

  // globals variables
  const addressTokens = 'testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp';
  const mintSupply = 100_000_000;
  const jobPrice = 5_000_000;

  // we'll set these later
  let mintTokens, bump;

  const wallets = {user: '', vault: ''}
  const spl = {nos: '', vault: ''}
  const balances = {user: 0, vault: 0}

  // initialize
  it('Create user', async () => {

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
    await program.rpc.createUser(
      bump,
      {
        accounts: {
          nos: spl.nos,
          vault: wallets.vault,
          payer: provider.wallet.publicKey,

          // required
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }
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

  // initialize
  it('Create job', async () => {

    // create the main token
    await program.rpc.createJob(
      bump,
      new anchor.BN(jobPrice),
      {
        accounts: {
          payer: provider.wallet.publicKey,
          nos: spl.nos,
          vault: wallets.vault,

          nosFrom: wallets.user,

          // required
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );

    // tests
    balances.user -= jobPrice
    balances.vault += jobPrice
    await utils.assertBalances(provider, wallets, balances)
  });
});

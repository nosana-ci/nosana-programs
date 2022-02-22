// imports
const anchor = require('@project-serum/anchor');
const assert = require('assert');
const {TOKEN_PROGRAM_ID} = require('@solana/spl-token');
const utils = require('./utils');

describe('staking', () => {

  // local provider
  const provider = anchor.Provider.local();

  // program to test
  const program = anchor.workspace.Staking;

  // globals variables
  const addressTokens = 'testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp';
  const addressReward = 'test65Hm1uoXA4C7BgiWddh9PHUTvgmKPVXAn13fvHy';
  const mintSupply = 100_000_000;
  const stakeAmount = 5_000_000;
  const airdropAmount = 1_000_000;

  // we'll set these later
  let mintTokens, mintReward, bump;

  const wallets = {tokens: '', reward: '', vault: ''}
  const spl = {tokens: '', reward: '', vault: ''}
  const balances = {tokens: 0, reward: 0, vault: 0}

  // initialize
  it('Create user', async () => {

    // create the main token
    mintTokens = await utils.mintFromFile(addressTokens, provider, provider.wallet.publicKey);
    assert.strictEqual(addressTokens, mintTokens.publicKey.toString());
    [wallets.vault, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [mintTokens.publicKey.toBuffer()],
      program.programId
    );

    // create the stake token
    mintReward = await utils.mintFromFile(addressReward, provider, wallets.vault);
    assert.strictEqual(addressReward, mintReward.publicKey.toString());

    // set spl for later
    spl.tokens = mintTokens.publicKey;
    spl.reward = mintReward.publicKey;
    spl.vault = wallets.vault;

    // initialize
    await program.rpc.createUser(
      bump,
      {
        accounts: {
          nos: spl.tokens,
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
});

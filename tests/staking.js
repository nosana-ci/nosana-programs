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
  let mintTokens, mintReward, nonce;

  const wallets = {tokens: '', reward: '', vault: ''}
  const spl = {tokens: '', reward: '', vault: ''}
  const balances = {tokens: 0, reward: 0, vault: 0}

  // initialize
  it('Initialize accounts with tokens and rewards', async () => {

    // create the main token
    mintTokens = await utils.mintFromFile(addressTokens, provider, provider.wallet.publicKey);
    assert.strictEqual(addressTokens, mintTokens.publicKey.toString());
    [wallets.vault, nonce] = await anchor.web3.PublicKey.findProgramAddress(
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
    await program.rpc.initialize(
      nonce,
      {
        accounts: {
          tokens: spl.tokens,
          reward: spl.reward,
          vault: wallets.vault,
          initializer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }
      }
    );

    // tests
    await utils.assertPrice(program, spl, balances)
  });

  // mint
  it(`Create user ATAs for tokens and rewards, mint ${mintSupply} tokens`, async () => {

    // create associated token accounts
    wallets.tokens = await mintTokens.createAssociatedTokenAccount(provider.wallet.publicKey);
    wallets.reward = await mintReward.createAssociatedTokenAccount(provider.wallet.publicKey);

    // mint tokens
    await utils.mintToAccount(provider, mintTokens.publicKey, wallets.tokens, mintSupply);

    // tests
    balances.tokens += mintSupply
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });

  // stake
  it('Stake tokens and get rewards', async () => {

    // stake nos
    await program.rpc.stake(
      nonce,
      new anchor.BN(stakeAmount),
      {
        accounts: {
          tokens: spl.tokens,
          reward: spl.reward,
          vault: wallets.vault,
          from: wallets.tokens,
          to: wallets.reward,
          fromAuthority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );

    // tests
    balances.tokens -= stakeAmount
    balances.reward += stakeAmount
    balances.vault += stakeAmount
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });

  it(`Mint additional ${airdropAmount} tokens to the pool`, async () => {

    // mint additionally
    await utils.mintToAccount(provider, mintTokens.publicKey, wallets.vault, airdropAmount);

    balances.vault += airdropAmount
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });

  it('Unstake and redeem rewards for tokens', async () => {

    // unstake nos
    await program.rpc.unstake(
      nonce,
      new anchor.BN(stakeAmount),
      {
        accounts: {
          tokens: spl.tokens,
          reward: spl.reward,
          vault: wallets.vault,
          from: wallets.reward,
          to: wallets.tokens,
          fromAuthority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );

    // tests
    balances.tokens += balances.vault
    balances.reward -= stakeAmount
    balances.vault -= balances.vault
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });

  it(`Mint ${airdropAmount} tokens to the pool before reward creation`, async () => {

    // mint tokens to empty vault
    await utils.mintToAccount(provider, mintTokens.publicKey, wallets.vault, airdropAmount);

    // tests
    balances.vault += airdropAmount
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });

  it('Stake tokens for rewards on prefilled pool', async () => {

    // stake nos
    await program.rpc.stake(
      nonce,
      new anchor.BN(stakeAmount),
      {
        accounts: {
          tokens: spl.tokens,
          reward: spl.reward,
          vault: wallets.vault,
          from: wallets.tokens,
          to: wallets.reward,
          fromAuthority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );

    // tests
    balances.tokens -= stakeAmount
    balances.reward += stakeAmount
    balances.vault += stakeAmount
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });

  it('Unstake and redeem reward for token after prefilled pool', async () => {

    // unstake nos
    await program.rpc.unstake(
      nonce,
      new anchor.BN(stakeAmount),
      {
        accounts: {
          tokens: spl.tokens,
          reward: spl.reward,
          vault: wallets.vault,
          from: wallets.reward,
          to: wallets.tokens,
          fromAuthority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );

    // tests
    balances.tokens += balances.vault
    balances.reward -= stakeAmount
    balances.vault -= balances.vault
    await utils.assertBalances(provider, wallets, balances)
    await utils.assertPrice(program, spl, balances)
  });
});

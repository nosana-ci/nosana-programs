import * as anchor from '@project-serum/anchor';
import * as serumCmn from '@project-serum/common';
import { expect } from 'chai';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

async function getTokenBalance(provider, wallet) {
  return parseInt((await provider.connection.getTokenAccountBalance(wallet)).value.amount);
}

async function assertBalancesJobs(provider, wallets, balances) {
  for (const pool of ['user', 'vaultJob']) {
    console.log(`       ==> Balance pool: ${pool}, ${balances[pool]} tokens`);
  }
  expect(await getTokenBalance(provider, wallets.user)).to.equal(balances.user);
  expect(await getTokenBalance(provider, wallets.vaultJob)).to.equal(balances.vaultJob);
}

async function assertBalancesStaking(provider, wallets, balances) {
  for (const pool of ['user', 'vaultStaking']) {
    console.log(`       ==> Balance pool: ${pool}, ${balances[pool]} tokens`);
  }
  expect(await getTokenBalance(provider, wallets.user)).to.equal(balances.user);
  expect(await getTokenBalance(provider, wallets.vaultStaking)).to.equal(balances.vaultStaking);
}

async function mintFromFile(key, provider, authority) {
  const keyData = require(`./keys/${key}.json`);
  const keyPair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));
  return await createMint(provider.connection, provider.wallet.payer, authority, null, 6, keyPair);
}

async function mintToAccount(provider, mint, destination, amount) {
  const tx = new anchor.web3.Transaction();
  tx.add(createMintToInstruction(mint, destination, provider.wallet.publicKey, amount, [], TOKEN_PROGRAM_ID));
  await provider.sendAndConfirm(tx);
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map((x) => x.toString().padStart(2, '0')).join('');
}

function timeDelta(t1, t2) {
  return t1.toNumber() * 1e3 - t2;
}

async function getOrCreateAssociatedSPL(provider, owner, mint) {
  const ata = await getAssociatedTokenAddress(mint, owner);
  try {
    await serumCmn.getTokenAccount(provider, ata);
  } catch (error) {
    const tx = new anchor.web3.Transaction();
    tx.add(createAssociatedTokenAccountInstruction(owner, ata, owner, mint));
    await provider.sendAndConfirm(tx, [], {});
  }
  return ata;
}

function setupSolanaUser(connection) {
  const user = anchor.web3.Keypair.generate();
  const publicKey = user.publicKey;
  const wallet = new anchor.Wallet(user);
  const provider = new anchor.AnchorProvider(connection, wallet, undefined);
  const balance = undefined;
  const ata = undefined;
  const jobs = undefined;
  const job = undefined;
  const stake = undefined;
  const signers = {
    jobs: anchor.web3.Keypair.generate(),
    job: anchor.web3.Keypair.generate(),
  };
  return {
    user,
    publicKey,
    wallet,
    provider,
    signers,
    balance,
    ata,
    job,
    jobs,
    stake,
  };
}

function calculateXnos(unstakeTime, currentTime, duration, amount) {
  const secondsPerMonth = (365 * 24 * 60 * 60) / 12;
  const elapsed = unstakeTime === 0 ? 0 : currentTime - unstakeTime;
  return Math.floor(((duration - elapsed) * amount) / secondsPerMonth);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export {
  mintFromFile,
  mintToAccount,
  assertBalancesJobs,
  assertBalancesStaking,
  calculateXnos,
  buf2hex,
  timeDelta,
  getOrCreateAssociatedSPL,
  getTokenBalance,
  setupSolanaUser,
  sleep,
};

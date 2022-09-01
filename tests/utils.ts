import * as anchor from '@project-serum/anchor';
import SecretKey = require('./keys/devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP.json');
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Connection, PublicKey, Signer } from '@solana/web3.js';
import { Context } from 'mocha';
import { AnchorProvider, BN } from '@project-serum/anchor';
import { expect } from 'chai';
import _ = require('lodash');

/**
 *
 * @param provider
 * @param wallet
 */
async function getTokenBalance(provider: AnchorProvider, wallet: PublicKey) {
  return parseInt((await provider.connection.getTokenAccountBalance(wallet)).value.amount);
}

/**
 *
 * @param connection
 * @param payer
 * @param authority
 */
async function mintFromFile(connection: Connection, payer: Signer, authority: PublicKey) {
  const keyPair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(SecretKey));
  return await createMint(connection, payer, authority, null, 6, keyPair);
}

/**
 *
 * @param provider
 * @param mint
 * @param destination
 * @param amount
 */
async function mintToAccount(provider: AnchorProvider, mint: PublicKey, destination: PublicKey, amount: number) {
  const tx = new anchor.web3.Transaction();
  tx.add(createMintToInstruction(mint, destination, provider.wallet.publicKey, amount, [], TOKEN_PROGRAM_ID));
  await provider.sendAndConfirm(tx);
}

/**
 *
 * @param buffer
 */
function buf2hex(buffer: Iterable<number>) {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map((x) => x.toString().padStart(2, '0')).join('');
}

/**
 *
 * @param provider
 * @param owner
 * @param mint
 */
async function getOrCreateAssociatedSPL(provider: AnchorProvider, owner: PublicKey, mint: PublicKey) {
  const ata = await getAssociatedTokenAddress(mint, owner);
  try {
    const tx = new anchor.web3.Transaction();
    tx.add(createAssociatedTokenAccountInstruction(owner, ata, owner, mint));
    await provider.sendAndConfirm(tx, [], {});
  } catch (error) {
    console.log('exists!');
  }
  return ata;
}

/**
 *
 * @param seeds
 * @param programId
 */
async function pda(seeds: Array<Buffer | Uint8Array>, programId: PublicKey) {
  return (await PublicKey.findProgramAddress(seeds, programId))[0];
}

/**
 *
 * @param duration
 * @param amount
 */
function calculateXnos(duration: number, amount: number) {
  const xnosDiv = ((365 * 24 * 60 * 60) / 12) * 4;
  return Math.floor((duration / xnosDiv + 1) * amount);
}

/**
 *
 * @param ms
 */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 *
 */
const now = function () {
  return Math.floor(Date.now() / 1e3);
};

/**
 *
 * @param mochaContext
 * @param stakePubkey
 * @param fee
 * @param reflection
 */
async function updateRewards(
  mochaContext: Context,
  stakePubkey: PublicKey,
  fee = new anchor.BN(0),
  reflection = new anchor.BN(0)
) {
  const stake = await mochaContext.stakingProgram.account.stakeAccount.fetch(stakePubkey);
  const stats = await mochaContext.rewardsProgram.account.statsAccount.fetch(mochaContext.accounts.stats);

  let amount = 0;
  if (!reflection.eqn(0)) {
    amount = reflection.div(mochaContext.total.rate).sub(stake.xnos).toNumber();
    mochaContext.total.xnos.isub(stake.xnos.add(new BN(amount)));
    mochaContext.total.reflection.isub(reflection);
  }

  if (!fee.eqn(0)) {
    mochaContext.total.xnos.iadd(fee);
    mochaContext.total.rate = mochaContext.total.reflection.div(mochaContext.total.xnos);
  } else {
    mochaContext.total.xnos.iadd(stake.xnos);
    mochaContext.total.reflection.iadd(stake.xnos.mul(mochaContext.total.rate));
  }

  expect(stats.rate.toString()).to.equal(mochaContext.total.rate.toString(), 'Rate error');
  expect(stats.totalXnos.toString()).to.equal(mochaContext.total.xnos.toString(), 'Total XNOS error');
  expect(stats.totalReflection.toString()).to.equal(mochaContext.total.reflection.toString(), 'Total reflection error');

  return amount;
}

/**
 *
 * @param mochaContext
 */
async function setupSolanaUser(mochaContext: Context) {
  const user = anchor.web3.Keypair.generate();
  const publicKey = user.publicKey;
  const wallet = new anchor.Wallet(user);
  const provider = new anchor.AnchorProvider(mochaContext.connection, wallet, {});

  // fund SOL
  await mochaContext.connection.confirmTransaction(
    await mochaContext.connection.requestAirdrop(publicKey, anchor.web3.LAMPORTS_PER_SOL)
  );
  // fund NOS
  const ata = await getOrCreateAssociatedSPL(provider, publicKey, mochaContext.mint);
  await mintToAccount(mochaContext.provider, mochaContext.mint, ata, mochaContext.constants.userSupply);
  // return user object
  return {
    user,
    publicKey,
    ata,
    provider,
    wallet,
    balance: mochaContext.constants.userSupply,
    // pdas
    project: await pda([utf8.encode('project'), publicKey.toBuffer()], mochaContext.jobsProgram.programId),
    stake: await pda(
      [utf8.encode('stake'), mochaContext.mint.toBuffer(), publicKey.toBuffer()],
      mochaContext.stakingProgram.programId
    ),
    reward: await pda([utf8.encode('reward'), publicKey.toBuffer()], mochaContext.rewardsProgram.programId),
    vault: await pda(
      [utf8.encode('vault'), mochaContext.mint.toBuffer(), publicKey.toBuffer()],
      mochaContext.stakingProgram.programId
    ),
    // undefined
    job: undefined,
    ataNft: undefined,
    metadataAddress: undefined,
  };
}

async function getUsers(mochaContext: Context, amount: number) {
  return await Promise.all(
    _.map(new Array(amount), async () => {
      return await setupSolanaUser(mochaContext);
    })
  );
}

export {
  buf2hex,
  calculateXnos,
  getOrCreateAssociatedSPL,
  getTokenBalance,
  getUsers,
  mintFromFile,
  mintToAccount,
  now,
  pda,
  setupSolanaUser,
  sleep,
  updateRewards,
};

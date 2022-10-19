import * as anchor from '@project-serum/anchor';
import MintKey = require('./keys/devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP.json');
import DummyKey = require('./keys/dumQVNHZ1KNcLmzjMaDPEA5vFCzwHEEcQmZ8JHmmCNH.json');
import { createMint, createAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Connection, PublicKey, Signer } from '@solana/web3.js';
import { Context } from 'mocha';
import { AnchorProvider, BN, Idl, Program, setProvider, Wallet } from '@project-serum/anchor';
import { expect } from 'chai';
import { createInterface } from 'readline';
import _ = require('lodash');
import { JobsProgram, PoolsProgram, RewardsProgram, StakingProgram } from './types/nosana';
import { constants } from './contstants';

/**
 *
 * @param address
 */
async function setupProgram(address: PublicKey) {
  const idl = (await Program.fetchIdl(address.toString())) as Idl;
  const program = new Program(idl, address);
  return program;
}

/**
 *
 * @param NosanaProgram
 */
async function setupAnchorAndPrograms() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as Wallet;

  const programs = {
    staking: (await setupProgram(constants.stakingProgramAddress)) as unknown as StakingProgram,
    rewards: (await setupProgram(constants.rewardsProgramAddress)) as unknown as RewardsProgram,
    pools: (await setupProgram(constants.poolsProgramAddress)) as unknown as PoolsProgram,
    jobs: (await setupProgram(constants.stakingProgramAddress)) as unknown as JobsProgram,
  };

  return {
    provider,
    wallet,
    programs,
  };
}

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
 */
function getDummyKey() {
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(DummyKey));
}

/**
 *
 * @param connection
 * @param payer
 * @param authority
 */
async function createNosMint(connection: Connection, payer: Signer, authority: PublicKey) {
  return await createMint(
    connection,
    payer,
    authority,
    null,
    6,
    anchor.web3.Keypair.fromSecretKey(new Uint8Array(MintKey))
  );
}

/**
 *
 * @param users
 * @param f
 */
async function mapUsers(users, f) {
  return await Promise.all(_.map(users, f));
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
 * @param seconds
 */
const sleep = (seconds: number) => new Promise((res) => setTimeout(res, seconds * 1e3));

/**
 *
 */
const getTimestamp = () => Math.floor(Date.now() / 1e3);

/**
 *
 */
const now = function () {
  return Math.floor(Date.now() / 1e3);
};

/**
 *
 */
const solanaExplorer = function (location: string, data = false) {
  let url = `https://explorer.solana.com/${location.length >= 80 ? 'tx' : 'address'}/${location}`;
  if (data) url += '/anchor-account';
  if (process.env.ANCHOR_PROVIDER_URL.toLowerCase().includes('devnet')) url += '?cluster=devnet';
  return url;
};

/**
 *
 * @param question
 */
async function ask(question): Promise<boolean> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.setPrompt(`${question} [yes/no]\n`);
  readline.prompt();

  return new Promise((resolve) => {
    let userInput;
    readline.on('line', (input) => {
      userInput = input;
      readline.close();
    });

    readline.on('close', () => {
      resolve(userInput === 'yes');
    });
  });
}

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
  const stats = await mochaContext.rewardsProgram.account.reflectionAccount.fetch(mochaContext.accounts.reflection);

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

async function mintNosTo(mochaContext: Context, to: PublicKey, amount: number | bigint) {
  await mintTo(mochaContext.connection, mochaContext.payer, mochaContext.mint, to, mochaContext.payer, amount);
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
  const ata = await createAssociatedTokenAccount(
    mochaContext.connection,
    mochaContext.payer,
    mochaContext.mint,
    publicKey
  );
  // fund user
  await mintNosTo(mochaContext, ata, mochaContext.constants.userSupply);

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
  ask,
  buf2hex,
  calculateXnos,
  getDummyKey,
  getTimestamp,
  getTokenBalance,
  getUsers,
  createNosMint,
  now,
  pda,
  setupAnchorAndPrograms,
  setupSolanaUser,
  setupProgram,
  sleep,
  solanaExplorer,
  updateRewards,
  mapUsers,
  mintNosTo,
};

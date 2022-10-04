import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import * as _ from 'lodash';
import { getTokenBalance, mapUsers, mintNosTo, setupSolanaUser } from '../../utils';
import users from '../../data/users.json';
import { Context } from 'mocha';

/**
 * Helper to fill the xnosPerc in users
 * @param mochaContext
 */
async function calcXnosPerc(mochaContext: Context) {
  const totalXnos = mochaContext.totalXnos.add(mochaContext.feesAdded).sub(mochaContext.feesClaimed).toNumber();
  await mapUsers(mochaContext.stakers, async function (user) {
    user.xnosPerc = (user.xnos.toNumber() + user.pending) / totalXnos;
    // console.log(u.xnosPerc, '% of pool', ' - pending reward: ', u.pending);
    return user;
  });
}

/**
 * Helper to add a fee and update pending rewards for users
 * @param mochaContext
 * @param amount
 */
async function addFee(mochaContext: Context, amount: number) {
  const amountBn = new BN(amount);
  await mochaContext.rewardsProgram.methods
    .addFee(amountBn)
    .accounts({
      ...mochaContext.accounts,
      reflection: mochaContext.accounts.reflection,
      vault: mochaContext.vaults.rewards,
    })
    .rpc();

  await mapUsers(mochaContext.stakers, function (user) {
    user.pending += user.xnosPerc * amount;
  });

  mochaContext.feesAdded.iadd(amountBn);
}

/**
 * helper to claim rewards for a user
 * @param mochaContext
 * @param user
 */
async function claim(mochaContext: Context, user) {
  await mochaContext.rewardsProgram.methods
    .claim()
    .accounts({
      ...mochaContext.accounts,
      stake: user.user.stake,
      reward: user.user.reward,
      authority: user.user.publicKey,
      user: user.user.ata,
      vault: mochaContext.vaults.rewards,
      reflection: mochaContext.accounts.reflection,
    })
    .signers([user.user.user])
    .rpc();
}

/**
 * Helper to call sync for a user stake
 * @param mochaContext
 * @param user
 */
async function sync(mochaContext: Context, user) {
  const reward = await mochaContext.rewardsProgram.account.rewardAccount.fetch(user.user.reward);
  const stake = await mochaContext.stakingProgram.account.stakeAccount.fetch(user.user.stake);
  mochaContext.totalXnos.isub(reward.xnos);

  await mochaContext.rewardsProgram.methods
    .sync()
    .accounts({
      stake: user.user.stake,
      reward: user.user.reward,
      reflection: mochaContext.accounts.reflection,
    })
    .rpc();

  const reward2 = await mochaContext.rewardsProgram.account.rewardAccount.fetch(user.user.reward);
  user.duration = stake.duration.toNumber();
  user.xnos = stake.xnos;
  mochaContext.totalXnos.iadd(reward2.xnos);
}

/**
 * Helper to call extend on a user stake
 * @param mochaContext
 * @param user
 * @param duration
 */
async function extend(mochaContext: Context, user, duration: number) {
  await mochaContext.stakingProgram.methods
    .extend(new BN(duration))
    .accounts({ ...mochaContext.accounts, stake: user.user.stake, authority: user.user.publicKey })
    .signers([user.user.user])
    .rpc();
}

/**
 * Helper to compare expected pending rewards with actual received
 * rewards. should be called after claim.
 * @param mochaContext
 * @param user
 */
async function claimAndCheck(mochaContext: Context, user) {
  const balanceBefore = await getTokenBalance(mochaContext.provider, user.user.ata);
  await claim(mochaContext, user);
  const balance = await getTokenBalance(mochaContext.provider, user.user.ata);
  // console.log('claim. nos', balanceBefore, ' => ', balance);
  mochaContext.feesClaimed.iadd(new BN(balance - balanceBefore));

  if (balance - balanceBefore != Math.round(user.pending)) {
    console.log('!!!! DETECTED DRIFT OF ', balance - balanceBefore - Math.round(user.pending));
  }
  expect(balance - balanceBefore).to.be.closeTo(Math.round(user.pending), 2);
  user.received.add(new BN(user.pending));
  user.pending = 0;
  return user;
}

/**
 *
 * @param mochaContext
 * @param step
 */
async function claimAndCheckIds(mochaContext: Context, step: number) {
  const ids = _.sampleSize(_.range(0, mochaContext.stakers.length), step);
  console.log('claiming for users ', ids);
  for (let i = 0; i < ids.length; i++) {
    await claimAndCheck(mochaContext, mochaContext.stakers[i]);
  }
}

/**
 *
 * @param mochaContext
 * @param user
 */
async function printReflections(mochaContext: Context, user) {
  const reward = await mochaContext.rewardsProgram.account.rewardAccount.fetch(user.user.reward);
  const reflection = await mochaContext.rewardsProgram.account.reflectionAccount.fetch(
    mochaContext.accounts.reflection
  );

  console.log('reflection: ', reward.reflection.toString(), ' xnos: ', reward.xnos.toString());
  console.log('rate: ', reflection.rate.toString());
}

/**
 * MAIN SCENARIO SUITE
 */
export default function suite() {
  it('init staking vault', async function () {
    await this.stakingProgram.methods.init().accounts(this.accounts).rpc();
  });

  it('init rewards vault', async function () {
    await this.rewardsProgram.methods
      .init()
      .accounts({ ...this.accounts, reflection: this.accounts.reflection, vault: this.vaults.rewards })
      .rpc();
  });

  it('init local mocha context', async function () {
    this.stakers = users;
    // uncomment below to use a smaller subset:
    // this.stakers = this.stakers.slice(0, 30);

    // track how many fees have been added
    this.totalXnos = new BN(0);
    this.feesAdded = new BN(0);
    this.feesClaimed = new BN(0);
  });

  it('setup stakes', async function () {
    const totalXnos = new BN(0);
    const mochaContext = this;
    await mapUsers(this.stakers, async function (user) {
      user.user = await setupSolanaUser(mochaContext);
      user.pending = 0.0;
      user.received = new BN(0);
      user.amount = new BN(user.amount);
      user.xnos = new BN(user.xnos);

      // make sure the users have enough funds
      await mintNosTo(mochaContext, user.user.ata, user.amount.toNumber());

      const accounts = {
        ...mochaContext.accounts,
        stake: user.user.stake,
        reward: user.user.reward,
        authority: user.user.publicKey,
        user: user.user.ata,
        vault: user.user.vault,
      };

      await mochaContext.stakingProgram.methods
        .stake(user.amount, new BN(user.duration))
        .accounts(accounts)
        .postInstructions([await mochaContext.rewardsProgram.methods.enter().accounts(accounts).instruction()])
        .signers([user.user.user])
        .rpc();

      const stake = await mochaContext.stakingProgram.account.stakeAccount.fetch(user.user.stake);
      expect(stake.xnos.toNumber()).to.equal(user.xnos.toNumber());
      totalXnos.iadd(stake.xnos);
      return user;
    });

    this.totalXnos = totalXnos;
    await calcXnosPerc(this);
    await printReflections(this, this.stakers[0]);
  });

  it('adds fees', async function () {
    // we are going to reserve 100 million tokens to distribute
    await mintNosTo(this, this.accounts.user, 100_000_000 * this.constants.decimals);

    console.log(' - add 1 NOS - ');
    await addFee(this, 1 * this.constants.decimals);
    await calcXnosPerc(this);
    await claimAndCheck(this, this.stakers[0]);
    await calcXnosPerc(this);

    console.log(' - add 10 NOS - ');
    await addFee(this, 10 * this.constants.decimals);
    await calcXnosPerc(this);
    await claimAndCheck(this, this.stakers[3]);
    await calcXnosPerc(this);

    console.log('---> Doing one sync');
    await sync(this, this.stakers[2]);

    console.log(' - add 10_000 NOS - ');
    await addFee(this, 10_000 * this.constants.decimals);
    await calcXnosPerc(this);
    await claimAndCheck(this, this.stakers[2]);
    await calcXnosPerc(this);

    console.log('-----> Doing an extend and sync');
    await calcXnosPerc(this);
    await extend(this, this.stakers[2], 10_000);
    await calcXnosPerc(this);
    await sync(this, this.stakers[2]);
    await calcXnosPerc(this);

    console.log(' - add 1,000,000 NOS - ');
    await addFee(this, 1_000_000 * this.constants.decimals);
    await calcXnosPerc(this);
    await claimAndCheck(this, this.stakers[2]);
    await calcXnosPerc(this);
    await claimAndCheck(this, this.stakers[0]);
    await calcXnosPerc(this);

    for (let i = 0; i < 2; i++) {
      console.log(' - add 1540 NOS - iteration', i);
      await addFee(this, 1_540 * this.constants.decimals);
      await calcXnosPerc(this);
      await claimAndCheckIds(this, 5);
      await calcXnosPerc(this);
    }

    for (let i = 0; i < 2; i++) {
      console.log(' - add 0.259099 NOS - iteration: ', i);
      await addFee(this, 259099);
      await calcXnosPerc(this);
      await claimAndCheckIds(this, 5);
      await calcXnosPerc(this);
    }

    for (let i = 0; i < 5; i++) {
      console.log(' - add 250,000 NOS - iteration: ', i);
      await addFee(this, 250_000 * this.constants.decimals);
      await calcXnosPerc(this);
      await claimAndCheckIds(this, 5);
      await calcXnosPerc(this);
    }

    for (let i = 0; i < 5; i++) {
      console.log(' - add 1,250,000 NOS - iteration: ', i);
      await addFee(this, 1_250_000 * this.constants.decimals);
      await calcXnosPerc(this);
      await claimAndCheckIds(this, 3);
      await calcXnosPerc(this);
    }

    await claim(this, this.stakers[1]);
    const balance = await getTokenBalance(this.provider, this.stakers[0].user.ata);
    console.log('Claimed for user[1] = ' + balance);
  });
}

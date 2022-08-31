import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import * as _ from 'lodash';
import * as utils from '../../utils';

export default function suite() {
  before(async function () {
    // init staking
    await this.stakingProgram.methods
      .init()
      .accounts({ ...this.accounts, settings: this.accounts.settings })
      .rpc();

    // init rewards
    await this.rewardsProgram.methods
      .init()
      .accounts({ ...this.accounts, stats: this.accounts.stats, vault: this.vaults.rewards })
      .rpc();

    this.users = require('../../data/users.json');
    // uncomment below to use a smaller subset:
    // this.users = this.users.slice(0, 30);

    // helper to apply a function to each user
    this.mapUsers = async function (f) {
      await Promise.all(_.map(this.users, f));
    };

    // helper to fill the xnosPerc in this.users
    this.calcXnosPerc = async function () {
      const totalXnos = this.totalXnos.add(this.feesAdded).sub(this.feesClaimed).toNumber();
      await this.mapUsers(async function (u) {
        u.xnosPerc = (u.xnos.toNumber() + u.pending) / totalXnos;
        // console.log(u.xnosPerc, '% of pool', ' - pending reward: ', u.pending);
        return u;
      });
    };

    // helper to add a fee and update pending rewards for users
    this.addFee = async function (amount) {
      const amountBn = new BN(amount);
      await this.rewardsProgram.methods
        .addFee(amountBn)
        .accounts({ ...this.accounts, stats: this.accounts.stats, vault: this.vaults.rewards })
        .rpc();

      await this.mapUsers(function (u) {
        u.pending += u.xnosPerc * amount;
      });

      this.feesAdded = this.feesAdded.add(amountBn);
    };

    // helper to claim rewards for a user
    this.claim = async function (u) {
      await this.rewardsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          stake: u.user.stake,
          reward: u.user.reward,
          authority: u.user.publicKey,
          user: u.user.ata,
          vault: this.vaults.rewards,
          stats: this.accounts.stats,
        })
        .signers([u.user.user])
        .rpc();
    };

    // helper to call sync for a user stake
    this.sync = async function (u) {
      let reward = await this.rewardsProgram.account.rewardAccount.fetch(u.user.reward);
      let stake = await this.stakingProgram.account.stakeAccount.fetch(u.user.stake);
      this.totalXnos = this.totalXnos.sub(reward.xnos);

      await this.rewardsProgram.methods
        .sync()
        .accounts({
          stake: u.user.stake,
          reward: u.user.reward,
          stats: this.accounts.stats,
        })
        .rpc();

      let reward2 = await this.rewardsProgram.account.rewardAccount.fetch(u.user.reward);
      u.duration = stake.duration.toNumber();
      u.xnos = stake.xnos;
      this.totalXnos = this.totalXnos.add(reward2.xnos);
    };

    this.extend = async function (u, amount) {
      await this.stakingProgram.methods
        .extend(new BN(amount))
        .accounts({ ...this.accounts, stake: u.user.stake, authority: u.user.publicKey })
        .signers([u.user.user])
        .rpc();
    };

    // helper to compare expected pending rewards with actual received
    // rewards. should be called after claim.
    this.claimAndCheck = async function (u) {
      let balanceBefore = await utils.getTokenBalance(this.provider, u.user.ata);
      await this.claim(u);
      let balance = await utils.getTokenBalance(this.provider, u.user.ata);
      // console.log('claim. nos', balanceBefore, ' => ', balance);
      this.feesClaimed = this.feesClaimed.add(new BN(balance - balanceBefore));

      if (balance - balanceBefore != Math.round(u.pending)) {
        console.log('!!!! DETECTED DRIFT OF ', balance - balanceBefore - Math.round(u.pending));
      }
      expect(balance - balanceBefore).to.be.closeTo(Math.round(u.pending), 5);
      u.received.add(new BN(u.pending));
      u.pending = 0;
      return u;
    };

    this.claimAndCheckIds = async function (num) {
      const ids = _.sampleSize(_.range(0, this.users.length), num);
      console.log('claiming for users ', ids);
      for (let i = 0; i < ids.length; i++) {
        await this.claimAndCheck(this.users[i]);
      }
    };

    this.printReflections = async function (u) {
      const r = await this.rewardsProgram.account.rewardAccount.fetch(u.user.reward);
      const stats = await this.rewardsProgram.account.statsAccount.fetch(this.accounts.stats);

      console.log('reflection: ', r.reflection.toString(), ' xnos: ', r.xnos.toString());
      console.log('rate: ', stats.rate.toString());
    };

    // track how much fees have been added
    this.totalXnos = new BN(0);
    this.feesAdded = new BN(0);
    this.feesClaimed = new BN(0);
  });

  it('stakes', async function () {
    let totalXnos = new BN(0);
    let ctx = this;
    await this.mapUsers(async function (u) {
      u.user = await utils.setupSolanaUser(ctx);
      u.pending = 0.0;
      u.received = new BN(0);
      u.amount = new BN(u.amount);
      u.xnos = new BN(u.xnos);

      const accs = {
        ...ctx.accounts,
        stats: ctx.accounts.stats,
        stake: u.user.stake,
        reward: u.user.reward,
        authority: u.user.publicKey,
        user: u.user.ata,
        vault: u.user.vault,
      };

      const rewardOpen = await ctx.rewardsProgram.methods.enter().accounts(accs).instruction();

      await ctx.stakingProgram.methods
        .stake(u.amount, new BN(u.duration))
        .accounts(accs)
        .postInstructions([rewardOpen])
        .signers([u.user.user])
        .rpc();

      let stake = await ctx.stakingProgram.account.stakeAccount.fetch(u.user.stake);
      expect(stake.xnos.toNumber()).to.equal(u.xnos.toNumber());
      totalXnos = totalXnos.add(stake.xnos);

      return u;
    });

    this.totalXnos = totalXnos;

    await this.calcXnosPerc();
  });

  it('adds fees', async function () {
    // we are going to reserve a 100 million tokens to distribute
    await utils.mintToAccount(this.provider, this.mint, this.accounts.user, new BN('100000000000000'));

    console.log(' - add 1 NOS - ');
    await this.addFee('1000000');
    await this.calcXnosPerc();
    await this.claimAndCheck(this.users[0]);
    await this.calcXnosPerc();

    console.log(' - add 10 NOS - ');
    await this.addFee('10000000');
    await this.calcXnosPerc();
    await this.claimAndCheck(this.users[3]);
    await this.calcXnosPerc();

    console.log('---> Doing one sync');
    await this.sync(this.users[2]);

    console.log(' - add 1000000 NOS - ');
    await this.addFee('1000000000000');
    await this.claimAndCheck(this.users[2]);
    await this.calcXnosPerc();

    console.log('-----> Doing an extend and sync');
    await this.calcXnosPerc();
    await this.extend(this.users[2], 10000);
    await this.calcXnosPerc();
    await this.sync(this.users[2]);
    await this.calcXnosPerc();

    console.log(' - add 1,000,000 NOS - ');
    await this.addFee('1000000000000');
    await this.calcXnosPerc();
    await this.claimAndCheck(this.users[2]);
    await this.calcXnosPerc();
    await this.claimAndCheck(this.users[0]);
    await this.calcXnosPerc();

    for (let i = 0; i < 2; i++) {
      console.log(' - add 1540 NOS - iteration', i);
      await this.addFee('1540000000');
      await this.calcXnosPerc();
      await this.claimAndCheckIds(5);
      await this.calcXnosPerc();
    }

    for (let i = 0; i < 2; i++) {
      console.log(' - add 0.259099 NOS - iteration: ', i);
      await this.addFee('259099');
      await this.calcXnosPerc();
      await this.claimAndCheckIds(5);
      await this.calcXnosPerc();
    }

    for (let i = 0; i < 5; i++) {
      console.log(' - add 250,000 NOS - iteration: ', i);
      await this.addFee('250000000000');
      await this.calcXnosPerc();
      await this.claimAndCheckIds(5);
      await this.calcXnosPerc();
    }

    for (let i = 0; i < 5; i++) {
      console.log(' - add 1,250,000 NOS - iteration: ', i);
      await this.addFee('1250000000000');
      await this.calcXnosPerc();
      await this.claimAndCheckIds(3);
      await this.calcXnosPerc();
    }

    await this.claim(this.users[1]);
    let balance = await utils.getTokenBalance(this.provider, this.users[0].user.ata);
    console.log('Claimed for user[1] = ' + balance);
  });
}

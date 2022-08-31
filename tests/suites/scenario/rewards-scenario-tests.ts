import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import * as _ from 'lodash';
import * as utils from '../../utils';

export default function suite() {
  before(async function () {
    this.users = require('../../data/users.json');

    // init staking
    await this.teststakingProgram.methods
      .init()
      .accounts({ ...this.testaccounts, settings: this.teststats.staking })
      .rpc();

    // init rewards
    await this.testrewardsProgram.methods
      .init()
      .accounts({ ...this.testaccounts, stats: this.teststats.rewards, vault: this.testata.vaultRewards })
      .rpc();

    // helper to apply a function to each user
    this.mapUsers = async function (f) {
      await Promise.all(_.map(this.users, f));
    };

    await this.mapUsers(async (u) => {
      u.user = await utils.setupSolanaUser(this);
      u.pending = 0.0;
      u.received = new BN(0);
      return u;
    });

    // helper to fill the xnosPerc in this.users
    this.calcXnosPerc = async function () {
      const totalXnos = this.totalXnos.add(this.feesAdded).sub(this.feesClaimed).toNumber();
      // console.log('total xnos ', totalXnos);
      await this.mapUsers(async function (u) {
        u.xnosPerc = (u.xnos.toNumber() + u.pending) / totalXnos;
        // console.log(u.xnosPerc, '% of pool', ' - pending reward: ', u.pending);
        return u;
      });
    };

    // helper to add a fee and update pending rewards for users
    this.addFee = async function (amount) {
      const amountBn = new BN(amount);
      await this.testrewardsProgram.methods
        .addFee(amountBn)
        .accounts({ ...this.testaccounts, stats: this.teststats.rewards, vault: this.testata.vaultRewards })
        .rpc();

      await this.mapUsers((u) => {
        // const totalXnos = this.totalXnos.add(this.feesAdded).sub(this.feesClaimed);
        // console.log('tttt', totalXnos.toString());
        // console.log('hi', amountBn.mul(u.xnos.add(new BN(u.pending))).toNumber() / totalXnos.toNumber())
        // u.pending += u.xnos.add(new BN(u.pending)).div(totalXnos).mul(amountBn).toNumber();
        u.pending += u.xnosPerc * amount;
      });

      this.feesAdded = this.feesAdded.add(amountBn);
    };

    // helper to claim rewards for a user
    this.claim = async function (u) {
      await this.testrewardsProgram.methods
        .claim()
        .accounts({
          ...this.testaccounts,
          stake: u.user.stake,
          reward: u.user.reward,
          authority: u.user.publicKey,
          user: u.user.ata,
          vault: this.testata.vaultRewards,
          stats: this.teststats.rewards,
        })
        .signers([u.user.user])
        .rpc();
    };

    this.sync = async function (u) {
      await this.testrewardsProgram.methods
        .sync()
        .accounts({
          stake: u.user.stake,
          reward: u.user.reward,
          stats: this.teststats.rewards,
        })
        .rpc();
    };

    // helper to compare expected pending rewards with actual received
    // rewards. should be called after claim.
    this.claimAndCheck = async function (u) {
      let balanceBefore = await utils.getTokenBalance(this.testprovider, u.user.ata);
      await this.claim(u);
      let balance = await utils.getTokenBalance(this.testprovider, u.user.ata);
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
      const r = await this.testrewardsProgram.account.rewardAccount.fetch(u.user.reward);
      const stats = await this.testrewardsProgram.account.statsAccount.fetch(this.teststats.rewards);

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
    await this.mapUsers(async function (u) {
      u.amount = new BN(u.amount);
      u.xnos = new BN(u.xnos);
      const accs = {
        ...this.testaccounts,
        stats: this.teststats.rewards,
        stake: u.user.stake,
        reward: u.user.reward,
        authority: u.user.publicKey,
        user: u.user.ata,
        vault: u.user.vault,
      };

      const rewardOpen = await this.testrewardsProgram.methods.enter().accounts(accs).instruction();

      await this.teststakingProgram.methods
        .stake(u.amount, new BN(u.duration))
        .accounts(accs)
        .postInstructions([rewardOpen])
        .signers([u.user.user])
        .rpc();

      let stake = await this.teststakingProgram.account.stakeAccount.fetch(u.user.stake);
      expect(stake.xnos.toNumber()).to.equal(u.xnos.toNumber());
      totalXnos = totalXnos.add(stake.xnos);

      return u;
    });
    this.totalXnos = totalXnos;

    await this.calcXnosPerc();
  });

  it('adds fees', async function () {
    // we are going to reserve a 100 million tokens to distribute
    await utils.mintToAccount(this.testprovider, this.testmint, this.testata.user, new BN('100000000000000'));

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

    console.log(' DOING A BUNCH OF SYNCS');
    // await this.sync(this.users[0])
    // await this.sync(this.users[1])
    await this.sync(this.users[2]);
    // await this.sync(this.users[3])

    console.log(' - add 1000000 NOS - ');
    await this.addFee('1000000000000');
    await this.claimAndCheck(this.users[2]);
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

    for (let i = 0; i < 10; i++) {
      console.log(' - add 1,250,000 NOS - iteration: ', i);
      await this.addFee('1250000000000');
      await this.calcXnosPerc();
      await this.claimAndCheckIds(20);
      await this.calcXnosPerc();
    }

    await this.claim(this.users[1]);
    let balance = await utils.getTokenBalance(this.testprovider, this.users[0].user.ata);
    console.log('Claimed for user[1] = ' + balance);
  });
}

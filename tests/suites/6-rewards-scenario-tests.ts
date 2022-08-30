import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import * as _ from 'lodash';
import * as utils from '../utils';

export default function suite() {
  before(async function () {
    this.users = [{amount: 8362000000,  duration: 31536000,  xnos: 33448000000},
                  {amount: 27274000000, duration: 31449600,  xnos: 108871830136},
                  {amount: 249000000,   duration: 10368000,  xnos: 494589041  },
                  {amount: 4998200000,  duration: 31536000,  xnos: 19992800000}];

    // init staking
    await global.stakingProgram.methods.init()
      .accounts({...global.accounts, settings: global.stats.staking})
      .rpc();

    // init rewards
    await global.rewardsProgram.methods.init()
      .accounts({...global.accounts, stats: global.stats.rewards, vault: global.ata.vaultRewards})
      .rpc();

    // helper to apply a function to each user
    this.mapUsers = async function (f) {
      await Promise.all(_.map(this.users, f));
    };

    await this.mapUsers(async (u) => {
      u.user = await utils.setupSolanaUser(global.mint, u.amount, global.provider);
      u.pending = 0;
      u.received = 0;
      return u;
    });

    // helper to fill the xnosPerc in this.users
    this.calcXnosPerc = async function () {
      const totalXnos = this.totalXnos.add(this.feesAdded).sub(this.feesClaimed).toNumber();
      console.log('total xnos ', totalXnos);
      await this.mapUsers(async function (u) {
        u.xnosPerc = (u.xnos + u.pending) / totalXnos;
        console.log('pend: ', u.pending, '%% ', u.xnosPerc);
        return u;
      });
    };

    // helper to add a fee and update pending rewards for users
    this.addFee = async function (amount) {
      await global.rewardsProgram.methods.addFee(new BN(amount))
        .accounts({...global.accounts, stats: global.stats.rewards, vault: global.ata.vaultRewards})
        .rpc();
      this.feesAdded = this.feesAdded.add(new BN(amount))
      await this.mapUsers((u) => {
        u.pending += amount * u.xnosPerc;
      });
    };

    // helper to claim rewards for a user
    this.claim = async function (u) {
      await global.rewardsProgram.methods.claim()
        .accounts({...global.accounts, stake: u.user.stake, reward: u.user.reward,
                   authority: u.user.publicKey, user: u.user.ata, vault: global.ata.vaultRewards,
                   stats: global.stats.rewards})
        .signers([u.user.user])
        .rpc();
      this.feesClaimed = this.feesClaimed.add(new BN(u.pending));
    };

    // helper to compare expected pending rewards with actual received
    // rewards. should be called after claim.
    this.claimAndCheck = async function (u) {
      let balanceBefore = await utils.getTokenBalance(global.provider, u.user.ata);
      await this.claim(u);
      let balance = await utils.getTokenBalance(global.provider, u.user.ata);
      console.log('claim. nos', balanceBefore, ' => ', balance);

      expect(balance - balanceBefore).to.equal(Math.floor(u.pending));
      u.received += u.pending;
      u.pending = 0;
      return u;
    };

    this.printReflections = async function (u) {
      const r = await global.rewardsProgram.account.rewardAccount.fetch(u.user.reward);
      const stats = await global.rewardsProgram.account.statsAccount.fetch(global.stats.rewards);

      console.log('reflection: ' , r.reflection.toString() , ' xnos: ', r.xnos.toString());
      console.log('rate: ' , stats.rate.toString());
    }

    // track how much fees have been added
    this.totalXnos = new BN(0);
    this.feesAdded = new BN(0);
    this.feesClaimed = new BN(0);
  });

  it('stakes', async function () {
    let totalXnos = new BN(0);
    await this.mapUsers(async function (u) {
      const accs = {...global.accounts, stats: global.stats.rewards, stake: u.user.stake,
                    reward: u.user.reward, authority: u.user.publicKey, user: u.user.ata,
                    vault: u.user.vault};

      const rewardOpen = await global.rewardsProgram.methods
        .enter()
        .accounts(accs)
        .instruction();

      await global.stakingProgram.methods
        .stake(new BN(u.amount), new BN(u.duration))
        .accounts(accs)
        .postInstructions([rewardOpen])
        .signers([u.user.user])
        .rpc();

      let stake = await global.stakingProgram.account.stakeAccount.fetch(u.user.stake);
      expect(stake.xnos.toNumber()).to.equal(u.xnos);
      totalXnos = totalXnos.add(stake.xnos);

      return u;
    });
    this.totalXnos = totalXnos;

    await this.calcXnosPerc();
  });

  it('adds fees', async function () {
    // we are going to reserve a 100 million tokens to distribute
    await utils.mintToAccount(global.provider, global.mint, global.ata.user,
                              new BN('100000000000000'));

    console.log(' - add 1 NOS - ')
    await this.addFee('1000000');
    await this.claimAndCheck(this.users[0]);
    await this.calcXnosPerc();

    console.log(' - add 10 NOS - ')
    await this.addFee('10000000');
    await this.claimAndCheck(this.users[3]);
    await this.calcXnosPerc();

    console.log(' - add 100 NOS - ')
    await this.addFee('100000000');
    await this.claimAndCheck(this.users[2]);
    await this.calcXnosPerc();

    console.log(' - add 250,000 NOS - ')
    await this.addFee('250000000000');
    await this.claimAndCheck(this.users[1]);
    await this.calcXnosPerc();

    // console.log(' - add 11,000,000 NOS - ')
    // await this.addFee('11000000000000');
    // await this.claimAndCheck(this.users[0]);



    // let balance = await utils.getTokenBalance(global.provider, this.users[0].user.ata);
    // console.log(balance)


    // console.log(' - step 2 - ')
    // await this.addFee('1000');
    // await this.calcXnosPerc();
    // await this.claimAndCheck(this.users[0]);
    // await this.claimAndCheck(this.users[0]);
  });
}

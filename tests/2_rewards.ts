import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from './utils';
import c from './constants';

export default function suite() {
  async function updateRewards(t, stakePubkey, statsPubkey, fee = new anchor.BN(0), reflection = new anchor.BN(0)) {
    const stakeAccount = await t.stakingProgram.account.stakeAccount.fetch(stakePubkey);
    const statsAccount = await t.rewardsProgram.account.statsAccount.fetch(statsPubkey);

    let amount = 0;
    if (!reflection.eqn(0)) {
      amount = reflection.div(t.global.rate).sub(stakeAccount.xnos).toNumber();
      t.global.xnos.isub(stakeAccount.xnos);
      t.global.reflection.isub(reflection);
    }

    if (!fee.eqn(0)) {
      t.global.xnos.iadd(fee);
      t.global.rate = t.global.reflection.div(t.global.xnos);
    } else {
      t.global.xnos.iadd(stakeAccount.xnos);
      t.global.reflection.iadd(stakeAccount.xnos.mul(t.global.rate));
    }

    // console.log(`           ==> Total Xnos: ${global.xnos}, Total Reflection: ${global.reflection}, Rate: ${rate}`);

    expect(statsAccount.rate.toString()).to.equal(t.global.rate.toString(), 'Rate error');
    expect(statsAccount.totalXnos.toString()).to.equal(t.global.xnos.toString(), 'Total XNOS error');
    expect(statsAccount.totalReflection.toString()).to.equal(t.global.reflection.toString(), 'Total reflection error');

    return amount;
  }

  describe('init()', async function () {
    it('can initialize the rewards vault', async function () {
      this.accounts.stats = this.stats.rewards;
      this.accounts.vault = this.ata.vaultRewards;
      await this.rewardsProgram.methods.init().accounts(this.accounts).rpc();
      const data = await this.rewardsProgram.account.statsAccount.fetch(this.accounts.stats);
      expect(data.totalXnos.toString()).to.equal(this.global.xnos.toString());
      expect(data.totalReflection.toString()).to.equal(this.global.reflection.toString());
      expect(data.rate.toString()).to.equal(c.initialRate.toString());
      await utils.assertBalancesRewards(this.provider, this.ata, this.balances);
    });
  });

  describe('enter()', async function () {
    it('can not enter rewards pool with other stake', async function () {
      let msg = '';
      await this.rewardsProgram.methods
        .enter()
        .accounts({ ...this.accounts, stake: this.users.node1.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
    });

    it('can enter rewards pool with main wallet', async function () {
      await this.rewardsProgram.methods.enter().accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, this.accounts.stats);
    });

    it('can not unstake while reward is open', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .unstake()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeHasReward);
    });

    it('can enter rewards with the other nodes', async function () {
      for (const node of this.users.otherNodes) {
        await this.rewardsProgram.methods
          .enter()
          .accounts({ ...this.accounts, stake: node.stake, reward: node.reward, authority: node.publicKey })
          .signers([node.user])
          .rpc();
        await updateRewards(this, node.stake, this.accounts.stats);
      }
    });
  });

  describe('add_fee()', async function () {
    it('can add fees to the pool', async function () {
      await this.rewardsProgram.methods.addFee(new anchor.BN(c.feeAmount)).accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, this.accounts.stats, new anchor.BN(c.feeAmount));
      this.balances.user -= c.feeAmount;
      this.balances.vaultRewards += c.feeAmount;
      await utils.assertBalancesRewards(this.provider, this.ata, this.balances);
    });

    it('can claim rewards', async function () {
      const reflection = (await this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward)).reflection;

      await this.rewardsProgram.methods.claim().accounts(this.accounts).rpc();
      const amount = await updateRewards(this, this.accounts.stake, this.accounts.stats, new anchor.BN(0), reflection);

      this.balances.user += amount;
      this.balances.vaultRewards -= amount;
      await utils.assertBalancesRewards(this.provider, this.ata, this.balances);
    });

    it('Claim other rewards', async function () {
      for (const node of this.users.otherNodes) {
        const reflection = (await this.rewardsProgram.account.rewardAccount.fetch(node.reward)).reflection;
        await this.rewardsProgram.methods
          .claim()
          .accounts({
            ...this.accounts,
            stake: node.stake,
            reward: node.reward,
            authority: node.publicKey,
            user: node.ata,
          })
          .signers([node.user])
          .rpc();
        const amount = await updateRewards(this, node.stake, this.accounts.stats, new anchor.BN(0), reflection);
        node.balance += amount;
        this.balances.vaultRewards -= amount;
        await utils.assertBalancesRewards(this.provider, this.ata, this.balances);
      }
      expect(await utils.getTokenBalance(this.provider, this.ata.vaultRewards)).to.be.closeTo(0, 100, 'vault is empty');
    });
  });

  describe('sync()', async function () {
    it('Add more fees to the pool', async function () {
      await this.rewardsProgram.methods.addFee(new anchor.BN(c.feeAmount)).accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, this.accounts.stats, new anchor.BN(c.feeAmount));
      this.balances.user -= c.feeAmount;
      this.balances.vaultRewards += c.feeAmount;
      await utils.assertBalancesRewards(this.provider, this.ata, this.balances);
    });

    it('Topup stake', async function () {
      await this.stakingProgram.methods
        .topup(new anchor.BN(c.stakeAmount))
        .accounts({ ...this.accounts, vault: this.ata.userVaultStaking })
        .rpc();
      this.balances.user -= c.stakeAmount;
      this.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
      expect((await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)).xnos.toNumber()).to.equal(
        utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeAmount * 2 + c.stakeMinimum)
      );
    });

    it('can not sync reward reflection for wrong accounts', async function () {
      let msg = '';
      await this.rewardsProgram.methods
        .sync()
        .accounts({ ...this.accounts, reward: this.users.nodes[4].reward })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
    });

    it('can sync reward reflection', async function () {
      const before = await this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward);
      await this.rewardsProgram.methods.sync().accounts(this.accounts).rpc();
      const after = await this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward);
      const stake = (await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)).xnos.toNumber();

      expect(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
      expect(after.xnos.toNumber()).to.equal(stake);
      expect(after.xnos.toNumber()).to.equal(
        utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeAmount * 2 + c.stakeMinimum)
      );

      this.global.xnos.iadd(after.xnos.sub(before.xnos));
      this.global.reflection.isub(before.reflection);
      const reflection = after.xnos.add(before.reflection.div(new anchor.BN(this.global.rate))
        .sub(before.xnos))
        .mul(this.global.rate);
      this.global.reflection.iadd(reflection);

      expect(reflection.toString()).to.equal(after.reflection.toString());

      const rewardsAccount = await this.rewardsProgram.account.statsAccount.fetch(this.stats.rewards);

      expect(rewardsAccount.totalXnos.toString()).to.equal(this.global.xnos.toString(), 'Total XNOS error');
      expect(rewardsAccount.totalReflection.toString()).to.equal(
        this.global.reflection.toString(),
        'Total reflection error'
      );
      expect(rewardsAccount.rate.toString()).to.equal(this.global.rate.toString(), 'Rate error');
    });

    it('Add another round of fees to the pool', async function () {
      await this.rewardsProgram.methods.addFee(new anchor.BN(c.feeAmount)).accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, this.accounts.stats, new anchor.BN(c.feeAmount));
      this.balances.user -= c.feeAmount;
      this.balances.vaultRewards += c.feeAmount;
      await utils.assertBalancesRewards(this.provider, this.ata, this.balances);
    });

    it('Sync reward reflection for others', async function () {
      for (const node of this.users.otherNodes) {
        const before = await this.rewardsProgram.account.rewardAccount.fetch(node.reward);
        await this.rewardsProgram.methods
          .sync()
          .accounts({ ...this.accounts, stake: node.stake, reward: node.reward })
          .rpc();
        const after = await this.rewardsProgram.account.rewardAccount.fetch(node.reward);
        const stake = await this.stakingProgram.account.stakeAccount.fetch(node.stake);
        expect(before.xnos.toNumber()).to.equal(after.xnos.toNumber());
        expect(stake.xnos.toNumber()).to.equal(after.xnos.toNumber());
      }
    });
  });

  describe('close()', async function () {
    it('Close reward account and unstake in the same tx', async function () {
      await utils.assertBalancesRewards(this.provider, this.ata, this.balances);

      let stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.timeUnstake.toNumber()).to.equal(0);

      await this.stakingProgram.methods
        .unstake()
        .accounts(this.accounts)
        .preInstructions([await this.rewardsProgram.methods.close().accounts(this.accounts).instruction()])
        .rpc();

      stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.timeUnstake.toNumber()).to.not.equal(0);
      await this.stakingProgram.methods.restake().accounts(this.accounts).rpc();
    });

    it('Close other accounts', async function () {
      for (const node of this.users.otherNodes) {
        await this.rewardsProgram.methods
          .close()
          .accounts({
            ...this.accounts,
            reward: node.reward,
            stake: node.stake,
            authority: node.publicKey,
          })
          .signers([node.user])
          .rpc();
      }
    });
  });

  let alice, bob, carol;
  const setupUser = async (amount) => {
    await utils.setupSolanaUser(
      this.connection, this.mint, this.stakingProgram.programId, this.rewardsProgram.programId,
      amount, this.provider
    );
  };

  // describe('rewards scenarios', async function () {
  //   before(async function () {
  //     alice = await setupUser(600000000);
  //     console.log('hi');
  //     console.log(alice);
  //   });

  //   beforeEach(async function () {
  //   });

  //   it('works with large quantities', async function () {
  //     console.log(alice.user);
  //     console.log('ho');
  //     console.log(await utils.getTokenBalance(provider, alice.ata));
  //   });
  // });
}

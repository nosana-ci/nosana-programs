import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from '../utils';
import c from '../constants';

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
      this.global.accounts.stats = this.global.stats.rewards;
      this.global.accounts.vault = this.global.ata.vaultRewards;
      await this.global.rewardsProgram.methods.init().accounts(this.global.accounts).rpc();
      const data = await this.global.rewardsProgram.account.statsAccount.fetch(this.global.accounts.stats);
      expect(data.totalXnos.toString()).to.equal(this.global.global.xnos.toString());
      expect(data.totalReflection.toString()).to.equal(this.global.global.reflection.toString());
      expect(data.rate.toString()).to.equal(c.initialRate.toString());
      await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);
    });
  });

  describe('enter()', async function () {
    it('can not enter rewards pool with other stake', async function () {
      let msg = '';
      await this.global.rewardsProgram.methods
        .enter()
        .accounts({ ...this.global.accounts, stake: this.global.users.node1.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
    });

    it('can enter rewards pool with main wallet', async function () {
      await this.global.rewardsProgram.methods.enter().accounts(this.global.accounts).rpc();
      await updateRewards(this, this.global.accounts.stake, this.global.accounts.stats);
    });

    it('can not unstake while reward is open', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .unstake()
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeHasReward);
    });

    it('can enter rewards with the other nodes', async function () {
      for (const node of this.global.users.otherNodes) {
        await this.global.rewardsProgram.methods
          .enter()
          .accounts({ ...this.global.accounts, stake: node.stake, reward: node.reward, authority: node.publicKey })
          .signers([node.user])
          .rpc();
        await updateRewards(this, node.stake, this.global.accounts.stats);
      }
    });
  });

  describe('add_fee()', async function () {
    it('can add fees to the pool', async function () {
      await this.global.rewardsProgram.methods.addFee(new anchor.BN(c.feeAmount)).accounts(this.global.accounts).rpc();
      await updateRewards(this, this.global.accounts.stake, this.global.accounts.stats, new anchor.BN(c.feeAmount));
      this.global.balances.user -= c.feeAmount;
      this.global.balances.vaultRewards += c.feeAmount;
      await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can claim rewards', async function () {
      const reflection = (await this.global.rewardsProgram.account.rewardAccount.fetch(this.global.accounts.reward))
        .reflection;

      await this.global.rewardsProgram.methods.claim().accounts(this.global.accounts).rpc();
      const amount = await updateRewards(
        this,
        this.global.accounts.stake,
        this.global.accounts.stats,
        new anchor.BN(0),
        reflection
      );

      this.global.balances.user += amount;
      this.global.balances.vaultRewards -= amount;
      await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Claim other rewards', async function () {
      for (const node of this.global.users.otherNodes) {
        const reflection = (await this.global.rewardsProgram.account.rewardAccount.fetch(node.reward)).reflection;
        await this.global.rewardsProgram.methods
          .claim()
          .accounts({
            ...this.global.accounts,
            stake: node.stake,
            reward: node.reward,
            authority: node.publicKey,
            user: node.ata,
          })
          .signers([node.user])
          .rpc();
        const amount = await updateRewards(this, node.stake, this.global.accounts.stats, new anchor.BN(0), reflection);
        node.balance += amount;
        this.global.balances.vaultRewards -= amount;
        await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);
      }
      expect(await utils.getTokenBalance(this.global.provider, this.global.ata.vaultRewards)).to.be.closeTo(
        0,
        100,
        'vault is empty'
      );
    });
  });

  describe('sync()', async function () {
    it('Add more fees to the pool', async function () {
      await this.global.rewardsProgram.methods.addFee(new anchor.BN(c.feeAmount)).accounts(this.global.accounts).rpc();
      await updateRewards(this, this.global.accounts.stake, this.global.accounts.stats, new anchor.BN(c.feeAmount));
      this.global.balances.user -= c.feeAmount;
      this.global.balances.vaultRewards += c.feeAmount;
      await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Topup stake', async function () {
      await this.global.stakingProgram.methods
        .topup(new anchor.BN(c.stakeAmount))
        .accounts({ ...this.global.accounts, vault: this.global.ata.userVaultStaking })
        .rpc();
      this.global.balances.user -= c.stakeAmount;
      this.global.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
      expect(
        (await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake)).xnos.toNumber()
      ).to.equal(utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeAmount * 2 + c.stakeMinimum));
    });

    it('can not sync reward reflection for wrong accounts', async function () {
      let msg = '';
      await this.global.rewardsProgram.methods
        .sync()
        .accounts({ ...this.global.accounts, reward: this.global.users.nodes[4].reward })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
    });

    it('can sync reward reflection', async function () {
      const before = await this.global.rewardsProgram.account.rewardAccount.fetch(this.global.accounts.reward);
      await this.global.rewardsProgram.methods.sync().accounts(this.global.accounts).rpc();
      const after = await this.global.rewardsProgram.account.rewardAccount.fetch(this.global.accounts.reward);
      const stake = (
        await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake)
      ).xnos.toNumber();

      expect(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
      expect(after.xnos.toNumber()).to.equal(stake);
      expect(after.xnos.toNumber()).to.equal(
        utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeAmount * 2 + c.stakeMinimum)
      );

      this.global.global.xnos.iadd(after.xnos.sub(before.xnos));
      this.global.global.reflection.isub(before.reflection);
      const reflection = after.xnos
        .add(before.reflection.div(new anchor.BN(this.global.global.rate)).sub(before.xnos))
        .mul(this.global.global.rate);
      this.global.global.reflection.iadd(reflection);

      expect(reflection.toString()).to.equal(after.reflection.toString());

      const rewardsAccount = await this.global.rewardsProgram.account.statsAccount.fetch(this.global.stats.rewards);

      expect(rewardsAccount.totalXnos.toString()).to.equal(this.global.global.xnos.toString(), 'Total XNOS error');
      expect(rewardsAccount.totalReflection.toString()).to.equal(
        this.global.global.reflection.toString(),
        'Total reflection error'
      );
      expect(rewardsAccount.rate.toString()).to.equal(this.global.global.rate.toString(), 'Rate error');
    });

    it('Add another round of fees to the pool', async function () {
      await this.global.rewardsProgram.methods.addFee(new anchor.BN(c.feeAmount)).accounts(this.global.accounts).rpc();
      await updateRewards(this, this.global.accounts.stake, this.global.accounts.stats, new anchor.BN(c.feeAmount));
      this.global.balances.user -= c.feeAmount;
      this.global.balances.vaultRewards += c.feeAmount;
      await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Sync reward reflection for others', async function () {
      for (const node of this.global.users.otherNodes) {
        const before = await this.global.rewardsProgram.account.rewardAccount.fetch(node.reward);
        await this.global.rewardsProgram.methods
          .sync()
          .accounts({ ...this.global.accounts, stake: node.stake, reward: node.reward })
          .rpc();
        const after = await this.global.rewardsProgram.account.rewardAccount.fetch(node.reward);
        const stake = await this.global.stakingProgram.account.stakeAccount.fetch(node.stake);
        expect(before.xnos.toNumber()).to.equal(after.xnos.toNumber());
        expect(stake.xnos.toNumber()).to.equal(after.xnos.toNumber());
      }
    });
  });

  describe('close()', async function () {
    it('Close reward account and unstake in the same tx', async function () {
      await utils.assertBalancesRewards(this.global.provider, this.global.ata, this.global.balances);

      let stake = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(stake.timeUnstake.toNumber()).to.equal(0);

      await this.global.stakingProgram.methods
        .unstake()
        .accounts(this.global.accounts)
        .preInstructions([
          await this.global.rewardsProgram.methods.close().accounts(this.global.accounts).instruction(),
        ])
        .rpc();

      stake = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(stake.timeUnstake.toNumber()).to.not.equal(0);
      await this.global.stakingProgram.methods.restake().accounts(this.global.accounts).rpc();
    });

    it('Close other accounts', async function () {
      for (const node of this.global.users.otherNodes) {
        await this.global.rewardsProgram.methods
          .close()
          .accounts({
            ...this.global.accounts,
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
      this.global.connection,
      this.global.mint,
      this.global.stakingProgram.programId,
      this.global.rewardsProgram.programId,
      amount,
      this.global.provider
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

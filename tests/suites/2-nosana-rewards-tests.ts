import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from '../utils';

export default function suite() {
  async function updateRewards(stakePubkey, statsPubkey, fee = new anchor.BN(0), reflection = new anchor.BN(0)) {
    const stakeAccount = await global.stakingProgram.account.stakeAccount.fetch(stakePubkey);
    const statsAccount = await global.rewardsProgram.account.statsAccount.fetch(statsPubkey);

    let amount = 0;
    if (!reflection.eqn(0)) {
      amount = reflection.div(global.total.rate).sub(stakeAccount.xnos).toNumber();
      global.total.xnos.isub(stakeAccount.xnos);
      global.total.reflection.isub(reflection);
    }

    if (!fee.eqn(0)) {
      global.total.xnos.iadd(fee);
      global.total.rate = global.total.reflection.div(global.total.xnos);
    } else {
      global.total.xnos.iadd(stakeAccount.xnos);
      global.total.reflection.iadd(stakeAccount.xnos.mul(global.total.rate));
    }

    // console.log(`           ==> Total Xnos: ${global.xnos}, Total Reflection: ${global.reflection}, Rate: ${rate}`);

    expect(statsAccount.rate.toString()).to.equal(global.total.rate.toString(), 'Rate error');
    expect(statsAccount.totalXnos.toString()).to.equal(global.total.xnos.toString(), 'Total XNOS error');
    expect(statsAccount.totalReflection.toString()).to.equal(
      global.total.reflection.toString(),
      'Total reflection error'
    );

    return amount;
  }

  describe('init()', async function () {
    it('can initialize the rewards vault', async function () {
      global.accounts.stats = global.stats.rewards;
      global.accounts.vault = global.ata.vaultRewards;
      await global.rewardsProgram.methods.init().accounts(global.accounts).rpc();
      const data = await global.rewardsProgram.account.statsAccount.fetch(global.accounts.stats);
      expect(data.totalXnos.toString()).to.equal(global.total.xnos.toString());
      expect(data.totalReflection.toString()).to.equal(global.total.reflection.toString());
      expect(data.rate.toString()).to.equal(global.constants.initialRate.toString());
      await utils.assertBalancesRewards(global.provider, global.ata, global.balances);
    });
  });

  describe('enter()', async function () {
    it('can not enter rewards pool with other stake', async function () {
      let msg = '';
      await global.rewardsProgram.methods
        .enter()
        .accounts({ ...global.accounts, stake: global.users.node1.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.Unauthorized);
    });

    it('can enter rewards pool with main wallet', async function () {
      await global.rewardsProgram.methods.enter().accounts(global.accounts).rpc();
      await updateRewards(global.accounts.stake, global.accounts.stats);
    });

    it('can not unstake while reward is open', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .unstake()
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.StakeHasReward);
    });

    it('can enter rewards with the other nodes', async function () {
      for (const node of global.users.otherNodes) {
        await global.rewardsProgram.methods
          .enter()
          .accounts({ ...global.accounts, stake: node.stake, reward: node.reward, authority: node.publicKey })
          .signers([node.user])
          .rpc();
        await updateRewards(node.stake, global.accounts.stats);
      }
    });
  });

  describe('add_fee()', async function () {
    it('can add fees to the pool', async function () {
      await global.rewardsProgram.methods
        .addFee(new anchor.BN(global.constants.feeAmount))
        .accounts(global.accounts)
        .rpc();
      await updateRewards(global.accounts.stake, global.accounts.stats, new anchor.BN(global.constants.feeAmount));
      global.balances.user -= global.constants.feeAmount;
      global.balances.vaultRewards += global.constants.feeAmount;
      await utils.assertBalancesRewards(global.provider, global.ata, global.balances);
    });

    it('can claim rewards', async function () {
      const reflection = (await global.rewardsProgram.account.rewardAccount.fetch(global.accounts.reward)).reflection;

      await global.rewardsProgram.methods.claim().accounts(global.accounts).rpc();
      const amount = await updateRewards(global.accounts.stake, global.accounts.stats, new anchor.BN(0), reflection);

      global.balances.user += amount;
      global.balances.vaultRewards -= amount;
      await utils.assertBalancesRewards(global.provider, global.ata, global.balances);
    });

    it('Claim other rewards', async function () {
      for (const node of global.users.otherNodes) {
        const reflection = (await global.rewardsProgram.account.rewardAccount.fetch(node.reward)).reflection;
        await global.rewardsProgram.methods
          .claim()
          .accounts({
            ...global.accounts,
            stake: node.stake,
            reward: node.reward,
            authority: node.publicKey,
            user: node.ata,
          })
          .signers([node.user])
          .rpc();
        const amount = await updateRewards(node.stake, global.accounts.stats, new anchor.BN(0), reflection);
        node.balance += amount;
        global.balances.vaultRewards -= amount;
        await utils.assertBalancesRewards(global.provider, global.ata, global.balances);
      }
      expect(await utils.getTokenBalance(global.provider, global.ata.vaultRewards)).to.be.closeTo(
        0,
        100,
        'vault is empty'
      );
    });
  });

  describe('sync()', async function () {
    it('Add more fees to the pool', async function () {
      await global.rewardsProgram.methods
        .addFee(new anchor.BN(global.constants.feeAmount))
        .accounts(global.accounts)
        .rpc();
      await updateRewards(global.accounts.stake, global.accounts.stats, new anchor.BN(global.constants.feeAmount));
      global.balances.user -= global.constants.feeAmount;
      global.balances.vaultRewards += global.constants.feeAmount;
      await utils.assertBalancesRewards(global.provider, global.ata, global.balances);
    });

    it('Topup stake', async function () {
      await global.stakingProgram.methods
        .topup(new anchor.BN(global.constants.stakeAmount))
        .accounts({ ...global.accounts, vault: global.ata.userVaultStaking })
        .rpc();
      global.balances.user -= global.constants.stakeAmount;
      global.balances.vaultStaking += global.constants.stakeAmount;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
      expect((await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake)).xnos.toNumber()).to.equal(
        utils.calculateXnos(
          global.constants.stakeDurationMin * 2 + 7,
          global.constants.stakeAmount * 2 + global.constants.stakeMinimum
        )
      );
    });

    it('can not sync reward reflection for wrong accounts', async function () {
      let msg = '';
      await global.rewardsProgram.methods
        .sync()
        .accounts({ ...global.accounts, reward: global.users.nodes[4].reward })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.Unauthorized);
    });

    it('can sync reward reflection', async function () {
      const before = await global.rewardsProgram.account.rewardAccount.fetch(global.accounts.reward);
      await global.rewardsProgram.methods.sync().accounts(global.accounts).rpc();
      const after = await global.rewardsProgram.account.rewardAccount.fetch(global.accounts.reward);
      const stake = (await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake)).xnos.toNumber();

      expect(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
      expect(after.xnos.toNumber()).to.equal(stake);
      expect(after.xnos.toNumber()).to.equal(
        utils.calculateXnos(
          global.constants.stakeDurationMin * 2 + 7,
          global.constants.stakeAmount * 2 + global.constants.stakeMinimum
        )
      );

      global.total.xnos.iadd(after.xnos.sub(before.xnos));
      global.total.reflection.isub(before.reflection);
      const reflection = after.xnos
        .add(before.reflection.div(new anchor.BN(global.total.rate)).sub(before.xnos))
        .mul(global.total.rate);
      global.total.reflection.iadd(reflection);

      expect(reflection.toString()).to.equal(after.reflection.toString());

      const rewardsAccount = await global.rewardsProgram.account.statsAccount.fetch(global.stats.rewards);

      expect(rewardsAccount.totalXnos.toString()).to.equal(global.total.xnos.toString(), 'Total XNOS error');
      expect(rewardsAccount.totalReflection.toString()).to.equal(
        global.total.reflection.toString(),
        'Total reflection error'
      );
      expect(rewardsAccount.rate.toString()).to.equal(global.total.rate.toString(), 'Rate error');
    });

    it('Add another round of fees to the pool', async function () {
      await global.rewardsProgram.methods
        .addFee(new anchor.BN(global.constants.feeAmount))
        .accounts(global.accounts)
        .rpc();
      await updateRewards(global.accounts.stake, global.accounts.stats, new anchor.BN(global.constants.feeAmount));
      global.balances.user -= global.constants.feeAmount;
      global.balances.vaultRewards += global.constants.feeAmount;
      await utils.assertBalancesRewards(global.provider, global.ata, global.balances);
    });

    it('Sync reward reflection for others', async function () {
      for (const node of global.users.otherNodes) {
        const before = await global.rewardsProgram.account.rewardAccount.fetch(node.reward);
        await global.rewardsProgram.methods
          .sync()
          .accounts({ ...global.accounts, stake: node.stake, reward: node.reward })
          .rpc();
        const after = await global.rewardsProgram.account.rewardAccount.fetch(node.reward);
        const stake = await global.stakingProgram.account.stakeAccount.fetch(node.stake);
        expect(before.xnos.toNumber()).to.equal(after.xnos.toNumber());
        expect(stake.xnos.toNumber()).to.equal(after.xnos.toNumber());
      }
    });
  });

  describe('close()', async function () {
    it('Close reward account and unstake in the same tx', async function () {
      await utils.assertBalancesRewards(global.provider, global.ata, global.balances);

      let stake = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(stake.timeUnstake.toNumber()).to.equal(0);

      await global.stakingProgram.methods
        .unstake()
        .accounts(global.accounts)
        .preInstructions([await global.rewardsProgram.methods.close().accounts(global.accounts).instruction()])
        .rpc();

      stake = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(stake.timeUnstake.toNumber()).to.not.equal(0);
      await global.stakingProgram.methods.restake().accounts(global.accounts).rpc();
    });

    it('Close other accounts', async function () {
      for (const node of global.users.otherNodes) {
        await global.rewardsProgram.methods
          .close()
          .accounts({
            ...global.accounts,
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
      global.connection,
      global.mint,
      global.stakingProgram.programId,
      global.rewardsProgram.programId,
      amount,
      global.provider
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

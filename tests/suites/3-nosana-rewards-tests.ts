import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { BN } from '@project-serum/anchor';
import { calculateXnos, getTokenBalance, updateRewards } from '../utils';

export default function suite() {
  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    expect(await getTokenBalance(this.provider, this.ata.vaultRewards)).to.equal(this.balances.vaultRewards);
  });

  describe('init()', async function () {
    it('can initialize the rewards vault', async function () {
      this.accounts.vault = this.ata.vaultRewards;
      await this.rewardsProgram.methods.init().accounts(this.accounts).rpc();

      // test stats
      const stats = await this.rewardsProgram.account.statsAccount.fetch(this.accounts.stats);
      expect(stats.totalXnos.toString()).to.equal(this.total.xnos.toString());
      expect(stats.totalReflection.toString()).to.equal(this.total.reflection.toString());
      expect(stats.rate.toString()).to.equal(this.constants.initialRate.toString());
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
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can enter rewards pool with main wallet', async function () {
      await this.rewardsProgram.methods.enter().accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake);
    });

    it('can not unstake while reward is open', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .unstake()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeHasReward);
    });

    it('can enter rewards with the other nodes', async function () {
      for (const node of this.users.otherNodes) {
        await this.rewardsProgram.methods
          .enter()
          .accounts({ ...this.accounts, stake: node.stake, reward: node.reward, authority: node.publicKey })
          .signers([node.user])
          .rpc();
        await updateRewards(this, node.stake);
      }
    });
  });

  describe('add_fee()', async function () {
    it('can add fees to the pool', async function () {
      const fee = new BN(this.constants.feeAmount);
      await this.rewardsProgram.methods.addFee(fee).accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, fee);
      this.balances.user -= this.constants.feeAmount;
      this.balances.vaultRewards += this.constants.feeAmount;
    });

    it('can claim rewards', async function () {
      const reflection = (await this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward)).reflection;

      await this.rewardsProgram.methods.claim().accounts(this.accounts).rpc();
      const amount = await updateRewards(this, this.accounts.stake, new anchor.BN(0), reflection);

      this.balances.user += amount;
      this.balances.vaultRewards -= amount;
    });

    it('can claim rewards with other users', async function () {
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
        const amount = await updateRewards(this, node.stake, new anchor.BN(0), reflection);
        node.balance += amount;
        this.balances.vaultRewards -= amount;
      }
      expect(await getTokenBalance(this.provider, this.ata.vaultRewards)).to.be.closeTo(0, 100, 'vault is empty');
    });
  });

  describe('sync()', async function () {
    it('can add more fees to the pool', async function () {
      await this.rewardsProgram.methods.addFee(new anchor.BN(this.constants.feeAmount)).accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, new anchor.BN(this.constants.feeAmount));
      this.balances.user -= this.constants.feeAmount;
      this.balances.vaultRewards += this.constants.feeAmount;
    });

    it('can topup stake', async function () {
      await this.stakingProgram.methods
        .topup(new anchor.BN(this.constants.stakeAmount))
        .accounts({ ...this.accounts, vault: this.ata.userVaultStaking })
        .rpc();
      this.balances.user -= this.constants.stakeAmount;
      this.balances.vaultStaking += this.constants.stakeAmount;
      expect((await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)).xnos.toNumber()).to.equal(
        calculateXnos(
          this.constants.stakeDurationMin * 2 + 7,
          this.constants.stakeAmount * 2 + this.constants.stakeMinimum
        )
      );
    });

    it('can not sync reward reflection for wrong accounts', async function () {
      let msg = '';
      await this.rewardsProgram.methods
        .sync()
        .accounts({ ...this.accounts, reward: this.users.nodes[4].reward })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can sync reward reflection', async function () {
      const before = await this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward);
      await this.rewardsProgram.methods.sync().accounts(this.accounts).rpc();
      const after = await this.rewardsProgram.account.rewardAccount.fetch(this.accounts.reward);
      const stake = (await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake)).xnos.toNumber();

      // test xnos before vs after
      expect(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
      expect(after.xnos.toNumber()).to.equal(stake);
      expect(after.xnos.toNumber()).to.equal(
        calculateXnos(
          this.constants.stakeDurationMin * 2 + 7,
          this.constants.stakeAmount * 2 + this.constants.stakeMinimum
        )
      );

      // update totals
      this.total.xnos.iadd(after.xnos.sub(before.xnos));
      this.total.reflection.isub(before.reflection);
      const reflection = after.xnos
        .add(before.reflection.div(new anchor.BN(this.total.rate)).sub(before.xnos))
        .mul(this.total.rate);
      this.total.reflection.iadd(reflection);
      expect(reflection.toString()).to.equal(after.reflection.toString());

      // test stats
      const stats = await this.rewardsProgram.account.statsAccount.fetch(this.accounts.stats);
      expect(stats.totalXnos.toString()).to.equal(this.total.xnos.toString(), 'Total XNOS error');
      expect(stats.totalReflection.toString()).to.equal(this.total.reflection.toString(), 'Total reflection error');
      expect(stats.rate.toString()).to.equal(this.total.rate.toString(), 'Rate error');
    });

    it('can add another round of fees to the pool', async function () {
      await this.rewardsProgram.methods.addFee(new anchor.BN(this.constants.feeAmount)).accounts(this.accounts).rpc();
      await updateRewards(this, this.accounts.stake, new anchor.BN(this.constants.feeAmount));
      this.balances.user -= this.constants.feeAmount;
      this.balances.vaultRewards += this.constants.feeAmount;
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
            authority: node.publicKey,
          })
          .signers([node.user])
          .rpc();
      }
    });
  });
}

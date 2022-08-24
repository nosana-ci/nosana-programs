import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from './utils';
import c from './constants';

export default function suite() {
  beforeEach(function () {
    this.accounts.vault = this.ata.userVaultStaking;
  });

  describe('init()', async function () {
    it('can initialize', async function () {
      this.accounts.settings = this.stats.staking;
      await this.stakingProgram.methods.init().accounts(this.accounts).rpc();
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });
  });

  describe('stake()', async function () {
    it('can not stake too short', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMin - 1))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooShort);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('can not stake too long', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMax + 1))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooLong);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('can not stake too little', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .stake(new anchor.BN(c.stakeMinimum - 1), new anchor.BN(c.stakeDurationMax))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeAmountNotEnough);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('can stake minimum', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(c.stakeMinimum), new anchor.BN(c.stakeDurationMin))
        .accounts(this.accounts)
        .rpc();

      // test this.balances
      this.balances.user -= c.stakeMinimum;
      this.balances.vaultStaking += c.stakeMinimum;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);

      // test staking account
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum, 'amount');
      expect(stake.vault.toString()).to.equal(this.accounts.vault.toString(), 'vault');
      expect(stake.authority.toString()).to.equal(this.accounts.authority.toString(), 'authority');
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin, 'duration');
      expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(c.stakeDurationMin, c.stakeMinimum), 'xnos');
    });

    it('can stake maximum', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMax))
        .accounts({
          ...this.accounts,
          user: this.users.user4.ata,
          authority: this.users.user4.publicKey,
          stake: this.users.user4.stake,
          vault: this.users.user4.vault,
        })
        .signers([this.users.user4.user])
        .rpc();
      this.users.user4.balance -= c.stakeAmount;
      this.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Stake for node 1, not enough for jobs', async function () {
      let amount = c.minimumNodeStake - 1;
      await this.stakingProgram.methods
        .stake(new anchor.BN(amount), new anchor.BN(c.stakeDurationMin))
        .accounts({
          ...this.accounts,
          user: this.users.node1.ata,
          authority: this.users.node1.publicKey,
          stake: this.users.node1.stake,
          vault: this.users.node1.vault,
        })
        .signers([this.users.node1.user])
        .rpc();
      this.users.node1.balance -= amount;
      this.balances.vaultStaking += amount;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Stake for node 2, and unstake', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(c.minimumNodeStake), new anchor.BN(c.stakeDurationMin))
        .accounts({
          ...this.accounts,
          user: this.users.node2.ata,
          authority: this.users.node2.publicKey,
          stake: this.users.node2.stake,
          vault: this.users.node2.vault,
        })
        .signers([this.users.node2.user])
        .rpc();
      await this.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.accounts,
          authority: this.users.node2.publicKey,
          reward: this.users.node2.reward,
          stake: this.users.node2.stake,
        })
        .signers([this.users.node2.user])
        .rpc();
      this.users.node2.balance -= c.minimumNodeStake;
      this.balances.vaultStaking += c.minimumNodeStake;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Stake for other nodes', async function () {
      await Promise.all(
        this.users.otherNodes.map(async (n) => {
          await this.stakingProgram.methods
            .stake(new anchor.BN(c.stakeAmount * 2), new anchor.BN(3 * c.stakeDurationMin))
            .accounts({
              ...this.accounts,
              user: n.ata,
              authority: n.publicKey,
              stake: n.stake,
              vault: n.vault,
            })
            .signers([n.user])
            .rpc();
          this.balances.vaultStaking += c.stakeAmount * 2;
          n.balance -= c.stakeAmount * 2;
          expect(await utils.getTokenBalance(this.provider, n.ata)).to.equal(n.balance);
        })
      );
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });
  });

  describe('extend()', async function () {
    it('can not extend with negative duration', async function () {
      const accountBefore = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      await this.stakingProgram.methods.extend(new anchor.BN(-7)).accounts(this.accounts).rpc();
      const accountAfter = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
    });

    it('Extend a stake too long', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .extend(new anchor.BN(c.stakeDurationMax))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooLong);
    });

    it('Extend a stake', async function () {
      await this.stakingProgram.methods.extend(new anchor.BN(c.stakeDurationMin)).accounts(this.accounts).rpc();

      // check stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin * 2 + 7);
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum);
      expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeMinimum), 'xnos');
    });
  });

  describe('unstake()', async function () {
    it('Unstake from other account', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .unstake()
        .accounts({ ...this.accounts, authority: this.users.user3.publicKey })
        .signers([this.users.user3.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Can not unstake with invalid reward account', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.accounts,
          reward: anchor.web3.Keypair.generate().publicKey,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDoesNotMatchReward);

      await this.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.accounts,
          reward: this.accounts.stake,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeHasReward);
    });

    it('Can unstake', async function () {
      await this.stakingProgram.methods.unstake().accounts(this.accounts).rpc();
      const data = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 2);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);

      // check stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.xnos.toNumber()).to.equal(0);
    });
  });

  describe('topup(), restake()', async function () {
    it('Topup after unstake', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .topup(new anchor.BN(c.stakeAmount))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeAlreadyUnstaked);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Restake', async function () {
      await this.stakingProgram.methods.restake().accounts(this.accounts).rpc();
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Topup', async function () {
      await this.stakingProgram.methods.topup(new anchor.BN(c.stakeAmount)).accounts(this.accounts).rpc();
      this.balances.user -= c.stakeAmount;
      this.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);

      // check stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin * 2 + 7, 'duration');
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum + c.stakeAmount, 'amount');
      expect(stake.xnos.toNumber()).to.equal(
        utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeMinimum + c.stakeAmount),
        'xnos'
      );
    });
  });

  describe('claim()', async function () {
    it('Claim before unstake', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .claim()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeNotUnstaked);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('Claim after too soon unstake', async function () {
      await this.stakingProgram.methods.unstake().accounts(this.accounts).rpc();
      let msg = '';
      await this.stakingProgram.methods
        .claim()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeLocked);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
      await this.stakingProgram.methods.restake().accounts(this.accounts).rpc();
    });

    //
    //  To run this test you will have to modify claim.rs and change stake.duration to 5 seconds:
    //
    //          constraint = stake.time_unstake + i64::try_from(5).unwrap() <
    //                                                          ^
    /*
      it('Claim after unstake duration', async function () {
      let balanceBefore = await utils.getTokenBalance(this.provider, this.users.node2.ata);
      await utils.sleep(5000);
      await this.stakingProgram.methods
      .claim()
      .accounts({
      ...this.accounts,
      user: this.users.node2.ata,
      stake: this.users.node2.stake,
      authority: this.users.node2.publicKey,
      vault: this.users.node2.vault,
      })
      .signers([this.users.node2.user])
      .rpc();
      let balanceAfter = await utils.getTokenBalance(this.provider, this.users.node2.ata);
      expect(balanceAfter).to.equal(balanceBefore + c.stakeAmount);
      });
    */
  });

  describe('slash(), update_authority()', async function () {
    it('Slash', async function () {
      const stakeBefore = await this.stakingProgram.account.stakeAccount.fetch(this.users.nodes[2].stake);

      await this.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...this.accounts, stake: this.users.nodes[2].stake, vault: this.users.nodes[2].vault })
        .rpc();

      this.balances.user += c.slashAmount;
      this.balances.vaultStaking -= c.slashAmount;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
      const stakeAfter = await this.stakingProgram.account.stakeAccount.fetch(nodes[2].stake);
      expect(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - c.slashAmount);
    });

    it('can not slash unauthorized', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...this.accounts, authority: this.users.node1.publicKey })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('can not slash unauthorized hack 2', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...this.accounts, settings: this.accounts.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Solana8ByteConstraint);
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('can update slash authority', async function () {
      await this.stakingProgram.methods
        .updateAuthority()
        .accounts({ ...this.accounts, newAuthority: this.users.node1.publicKey })
        .rpc();
      const stats = await this.stakingProgram.account.settingsAccount.fetch(this.accounts.settings);
      expect(stats.authority.toString()).to.equal(this.users.node1.publicKey.toString());
    });

    it('can slash with node 1', async function () {
      await this.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({
          ...this.accounts,
          stake: this.users.nodes[2].stake,
          authority: this.users.node1.publicKey,
          vault: this.users.nodes[2].vault,
        })
        .signers([this.users.node1.user])
        .rpc();

      this.balances.user += c.slashAmount;
      this.balances.vaultStaking -= c.slashAmount;
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });

    it('can update settings authority back', async function () {
      await this.stakingProgram.methods
        .updateAuthority()
        .accounts({ ...this.accounts, authority: this.users.node1.publicKey, newAuthority: this.accounts.authority })
        .signers([this.users.node1.user])
        .rpc();
      const stats = await this.stakingProgram.account.settingsAccount.fetch(this.accounts.settings);
      expect(stats.authority.toString()).to.equal(this.accounts.authority.toString());
    });
  });
}

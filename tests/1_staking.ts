import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from './utils';
import c from './constants';

export default function suite() {
  beforeEach(function () {
    this.global.accounts.vault = this.global.ata.userVaultStaking;
  });

  describe('init()', async function () {
    it('can initialize', async function () {
      this.global.accounts.settings = this.global.stats.staking;
      await this.global.stakingProgram.methods.init().accounts(this.global.accounts).rpc();
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });
  });

  describe('stake()', async function () {
    it('can not stake too short', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMin - 1))
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooShort);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can not stake too long', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMax + 1))
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooLong);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can not stake too little', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeMinimum - 1), new anchor.BN(c.stakeDurationMax))
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeAmountNotEnough);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can stake minimum', async function () {
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeMinimum), new anchor.BN(c.stakeDurationMin))
        .accounts(this.global.accounts)
        .rpc();

      // test this.global.balances
      this.global.balances.user -= c.stakeMinimum;
      this.global.balances.vaultStaking += c.stakeMinimum;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);

      // test staking account
      const stake = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum, 'amount');
      expect(stake.vault.toString()).to.equal(this.global.accounts.vault.toString(), 'vault');
      expect(stake.authority.toString()).to.equal(this.global.accounts.authority.toString(), 'authority');
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin, 'duration');
      expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(c.stakeDurationMin, c.stakeMinimum), 'xnos');
    });

    it('can stake maximum', async function () {
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMax))
        .accounts({
          ...this.global.accounts,
          user: this.global.users.user4.ata,
          authority: this.global.users.user4.publicKey,
          stake: this.global.users.user4.stake,
          vault: this.global.users.user4.vault,
        })
        .signers([this.global.users.user4.user])
        .rpc();
      this.global.users.user4.balance -= c.stakeAmount;
      this.global.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Stake for node 1, not enough for jobs', async function () {
      let amount = c.minimumNodeStake - 1;
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(amount), new anchor.BN(c.stakeDurationMin))
        .accounts({
          ...this.global.accounts,
          user: this.global.users.node1.ata,
          authority: this.global.users.node1.publicKey,
          stake: this.global.users.node1.stake,
          vault: this.global.users.node1.vault,
        })
        .signers([this.global.users.node1.user])
        .rpc();
      this.global.users.node1.balance -= amount;
      this.global.balances.vaultStaking += amount;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Stake for node 2, and unstake', async function () {
      await this.global.stakingProgram.methods
        .stake(new anchor.BN(c.minimumNodeStake), new anchor.BN(c.stakeDurationMin))
        .accounts({
          ...this.global.accounts,
          user: this.global.users.node2.ata,
          authority: this.global.users.node2.publicKey,
          stake: this.global.users.node2.stake,
          vault: this.global.users.node2.vault,
        })
        .signers([this.global.users.node2.user])
        .rpc();
      await this.global.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.global.accounts,
          authority: this.global.users.node2.publicKey,
          reward: this.global.users.node2.reward,
          stake: this.global.users.node2.stake,
        })
        .signers([this.global.users.node2.user])
        .rpc();
      this.global.users.node2.balance -= c.minimumNodeStake;
      this.global.balances.vaultStaking += c.minimumNodeStake;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Stake for other nodes', async function () {
      await Promise.all(
        this.global.users.otherNodes.map(async (n) => {
          await this.global.stakingProgram.methods
            .stake(new anchor.BN(c.stakeAmount * 2), new anchor.BN(3 * c.stakeDurationMin))
            .accounts({
              ...this.global.accounts,
              user: n.ata,
              authority: n.publicKey,
              stake: n.stake,
              vault: n.vault,
            })
            .signers([n.user])
            .rpc();
          this.global.balances.vaultStaking += c.stakeAmount * 2;
          n.balance -= c.stakeAmount * 2;
          expect(await utils.getTokenBalance(this.global.provider, n.ata)).to.equal(n.balance);
        })
      );
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });
  });

  describe('extend()', async function () {
    it('can not extend with negative duration', async function () {
      const accountBefore = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      await this.global.stakingProgram.methods.extend(new anchor.BN(-7)).accounts(this.global.accounts).rpc();
      const accountAfter = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
    });

    it('Extend a stake too long', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .extend(new anchor.BN(c.stakeDurationMax))
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooLong);
    });

    it('Extend a stake', async function () {
      await this.global.stakingProgram.methods
        .extend(new anchor.BN(c.stakeDurationMin))
        .accounts(this.global.accounts)
        .rpc();

      // check stake
      const stake = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin * 2 + 7);
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum);
      expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeMinimum), 'xnos');
    });
  });

  describe('unstake()', async function () {
    it('Unstake from other account', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .unstake()
        .accounts({ ...this.global.accounts, authority: this.global.users.user3.publicKey })
        .signers([this.global.users.user3.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Can not unstake with invalid reward account', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.global.accounts,
          reward: anchor.web3.Keypair.generate().publicKey,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDoesNotMatchReward);

      await this.global.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.global.accounts,
          reward: this.global.accounts.stake,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeHasReward);
    });

    it('Can unstake', async function () {
      await this.global.stakingProgram.methods.unstake().accounts(this.global.accounts).rpc();
      const data = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 2);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);

      // check stake
      const stake = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
      expect(stake.xnos.toNumber()).to.equal(0);
    });
  });

  describe('topup(), restake()', async function () {
    it('Topup after unstake', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .topup(new anchor.BN(c.stakeAmount))
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeAlreadyUnstaked);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Restake', async function () {
      await this.global.stakingProgram.methods.restake().accounts(this.global.accounts).rpc();
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Topup', async function () {
      await this.global.stakingProgram.methods.topup(new anchor.BN(c.stakeAmount)).accounts(this.global.accounts).rpc();
      this.global.balances.user -= c.stakeAmount;
      this.global.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);

      // check stake
      const stake = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.accounts.stake);
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
      await this.global.stakingProgram.methods
        .claim()
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeNotUnstaked);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('Claim after too soon unstake', async function () {
      await this.global.stakingProgram.methods.unstake().accounts(this.global.accounts).rpc();
      let msg = '';
      await this.global.stakingProgram.methods
        .claim()
        .accounts(this.global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeLocked);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
      await this.global.stakingProgram.methods.restake().accounts(this.global.accounts).rpc();
    });

    //
    //  To run this test you will have to modify claim.rs and change stake.duration to 5 seconds:
    //
    //          constraint = stake.time_unstake + i64::try_from(5).unwrap() <
    //                                                          ^
    /*
      it('Claim after unstake duration', async function () {
      let balanceBefore = await utils.getTokenBalance(this.global.provider, this.global.users.node2.ata);
      await utils.sleep(5000);
      await this.global.stakingProgram.methods
      .claim()
      .accounts({
      ...this.global.accounts,
      user: this.global.users.node2.ata,
      stake: this.global.users.node2.stake,
      authority: this.global.users.node2.publicKey,
      vault: this.global.users.node2.vault,
      })
      .signers([this.global.users.node2.user])
      .rpc();
      let balanceAfter = await utils.getTokenBalance(this.global.provider, this.global.users.node2.ata);
      expect(balanceAfter).to.equal(balanceBefore + c.stakeAmount);
      });
    */
  });

  describe('slash(), update_authority()', async function () {
    it('Slash', async function () {
      const stakeBefore = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.users.nodes[2].stake);

      await this.global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({
          ...this.global.accounts,
          stake: this.global.users.nodes[2].stake,
          vault: this.global.users.nodes[2].vault,
        })
        .rpc();

      this.global.balances.user += c.slashAmount;
      this.global.balances.vaultStaking -= c.slashAmount;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
      const stakeAfter = await this.global.stakingProgram.account.stakeAccount.fetch(this.global.users.nodes[2].stake);
      expect(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - c.slashAmount);
    });

    it('can not slash unauthorized', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...this.global.accounts, authority: this.global.users.node1.publicKey })
        .signers([this.global.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can not slash unauthorized hack 2', async function () {
      let msg = '';
      await this.global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...this.global.accounts, settings: this.global.accounts.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Solana8ByteConstraint);
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can update slash authority', async function () {
      await this.global.stakingProgram.methods
        .updateAuthority()
        .accounts({ ...this.global.accounts, newAuthority: this.global.users.node1.publicKey })
        .rpc();
      const stats = await this.global.stakingProgram.account.settingsAccount.fetch(this.global.accounts.settings);
      expect(stats.authority.toString()).to.equal(this.global.users.node1.publicKey.toString());
    });

    it('can slash with node 1', async function () {
      await this.global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({
          ...this.global.accounts,
          stake: this.global.users.nodes[2].stake,
          authority: this.global.users.node1.publicKey,
          vault: this.global.users.nodes[2].vault,
        })
        .signers([this.global.users.node1.user])
        .rpc();

      this.global.balances.user += c.slashAmount;
      this.global.balances.vaultStaking -= c.slashAmount;
      await utils.assertBalancesStaking(this.global.provider, this.global.ata, this.global.balances);
    });

    it('can update settings authority back', async function () {
      await this.global.stakingProgram.methods
        .updateAuthority()
        .accounts({
          ...this.global.accounts,
          authority: this.global.users.node1.publicKey,
          newAuthority: this.global.accounts.authority,
        })
        .signers([this.global.users.node1.user])
        .rpc();
      const stats = await this.global.stakingProgram.account.settingsAccount.fetch(this.global.accounts.settings);
      expect(stats.authority.toString()).to.equal(this.global.accounts.authority.toString());
    });
  });
}

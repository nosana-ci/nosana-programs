import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from '../utils';
import c from '../constants';

export default function suite() {
  beforeEach(function () {
    global.accounts.vault = global.ata.userVaultStaking;
  });

  describe('init()', async function () {
    it('can initialize', async function () {
      global.accounts.settings = global.stats.staking;
      await global.stakingProgram.methods.init().accounts(global.accounts).rpc();
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });
  });

  describe('stake()', async function () {
    it('can not stake too short', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMin - 1))
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooShort);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('can not stake too long', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMax + 1))
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooLong);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('can not stake too little', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeMinimum - 1), new anchor.BN(c.stakeDurationMax))
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeAmountNotEnough);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('can stake minimum', async function () {
      await global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeMinimum), new anchor.BN(c.stakeDurationMin))
        .accounts(global.accounts)
        .rpc();

      // test global.balances
      global.balances.user -= c.stakeMinimum;
      global.balances.vaultStaking += c.stakeMinimum;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);

      // test staking account
      const stake = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum, 'amount');
      expect(stake.vault.toString()).to.equal(global.accounts.vault.toString(), 'vault');
      expect(stake.authority.toString()).to.equal(global.accounts.authority.toString(), 'authority');
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin, 'duration');
      expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(c.stakeDurationMin, c.stakeMinimum), 'xnos');
    });

    it('can stake maximum', async function () {
      await global.stakingProgram.methods
        .stake(new anchor.BN(c.stakeAmount), new anchor.BN(c.stakeDurationMax))
        .accounts({
          ...global.accounts,
          user: global.users.user4.ata,
          authority: global.users.user4.publicKey,
          stake: global.users.user4.stake,
          vault: global.users.user4.vault,
        })
        .signers([global.users.user4.user])
        .rpc();
      global.users.user4.balance -= c.stakeAmount;
      global.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Stake for node 1, not enough for jobs', async function () {
      let amount = c.minimumNodeStake - 1;
      await global.stakingProgram.methods
        .stake(new anchor.BN(amount), new anchor.BN(c.stakeDurationMin))
        .accounts({
          ...global.accounts,
          user: global.users.node1.ata,
          authority: global.users.node1.publicKey,
          stake: global.users.node1.stake,
          vault: global.users.node1.vault,
        })
        .signers([global.users.node1.user])
        .rpc();
      global.users.node1.balance -= amount;
      global.balances.vaultStaking += amount;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Stake for node 2, and unstake', async function () {
      await global.stakingProgram.methods
        .stake(new anchor.BN(c.minimumNodeStake), new anchor.BN(c.stakeDurationMin))
        .accounts({
          ...global.accounts,
          user: global.users.node2.ata,
          authority: global.users.node2.publicKey,
          stake: global.users.node2.stake,
          vault: global.users.node2.vault,
        })
        .signers([global.users.node2.user])
        .rpc();
      await global.stakingProgram.methods
        .unstake()
        .accounts({
          ...global.accounts,
          authority: global.users.node2.publicKey,
          reward: global.users.node2.reward,
          stake: global.users.node2.stake,
        })
        .signers([global.users.node2.user])
        .rpc();
      global.users.node2.balance -= c.minimumNodeStake;
      global.balances.vaultStaking += c.minimumNodeStake;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Stake for other nodes', async function () {
      await Promise.all(
        global.users.otherNodes.map(async (n) => {
          await global.stakingProgram.methods
            .stake(new anchor.BN(c.stakeAmount * 2), new anchor.BN(3 * c.stakeDurationMin))
            .accounts({
              ...global.accounts,
              user: n.ata,
              authority: n.publicKey,
              stake: n.stake,
              vault: n.vault,
            })
            .signers([n.user])
            .rpc();
          global.balances.vaultStaking += c.stakeAmount * 2;
          n.balance -= c.stakeAmount * 2;
          expect(await utils.getTokenBalance(global.provider, n.ata)).to.equal(n.balance);
        })
      );
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });
  });

  describe('extend()', async function () {
    it('can not extend with negative duration', async function () {
      const accountBefore = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      await global.stakingProgram.methods.extend(new anchor.BN(-7)).accounts(global.accounts).rpc();
      const accountAfter = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
    });

    it('Extend a stake too long', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .extend(new anchor.BN(c.stakeDurationMax))
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDurationTooLong);
    });

    it('Extend a stake', async function () {
      await global.stakingProgram.methods
        .extend(new anchor.BN(c.stakeDurationMin))
        .accounts(global.accounts)
        .rpc();

      // check stake
      const stake = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(stake.duration.toNumber()).to.equal(c.stakeDurationMin * 2 + 7);
      expect(stake.amount.toNumber()).to.equal(c.stakeMinimum);
      expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(c.stakeDurationMin * 2 + 7, c.stakeMinimum), 'xnos');
    });
  });

  describe('unstake()', async function () {
    it('Unstake from other account', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .unstake()
        .accounts({ ...global.accounts, authority: global.users.user3.publicKey })
        .signers([global.users.user3.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Can not unstake with invalid reward account', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .unstake()
        .accounts({
          ...global.accounts,
          reward: anchor.web3.Keypair.generate().publicKey,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeDoesNotMatchReward);

      await global.stakingProgram.methods
        .unstake()
        .accounts({
          ...global.accounts,
          reward: global.accounts.stake,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeHasReward);
    });

    it('Can unstake', async function () {
      await global.stakingProgram.methods.unstake().accounts(global.accounts).rpc();
      const data = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 2);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);

      // check stake
      const stake = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
      expect(stake.xnos.toNumber()).to.equal(0);
    });
  });

  describe('topup(), restake()', async function () {
    it('Topup after unstake', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .topup(new anchor.BN(c.stakeAmount))
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeAlreadyUnstaked);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Restake', async function () {
      await global.stakingProgram.methods.restake().accounts(global.accounts).rpc();
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Topup', async function () {
      await global.stakingProgram.methods.topup(new anchor.BN(c.stakeAmount)).accounts(global.accounts).rpc();
      global.balances.user -= c.stakeAmount;
      global.balances.vaultStaking += c.stakeAmount;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);

      // check stake
      const stake = await global.stakingProgram.account.stakeAccount.fetch(global.accounts.stake);
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
      await global.stakingProgram.methods
        .claim()
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeNotUnstaked);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('Claim after too soon unstake', async function () {
      await global.stakingProgram.methods.unstake().accounts(global.accounts).rpc();
      let msg = '';
      await global.stakingProgram.methods
        .claim()
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.StakeLocked);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
      await global.stakingProgram.methods.restake().accounts(global.accounts).rpc();
    });

    //
    //  To run this test you will have to modify claim.rs and change stake.duration to 5 seconds:
    //
    //          constraint = stake.time_unstake + i64::try_from(5).unwrap() <
    //                                                          ^
    /*
      it('Claim after unstake duration', async function () {
      let balanceBefore = await utils.getTokenBalance(global.provider, global.users.node2.ata);
      await utils.sleep(5000);
      await global.stakingProgram.methods
      .claim()
      .accounts({
      ...global.accounts,
      user: global.users.node2.ata,
      stake: global.users.node2.stake,
      authority: global.users.node2.publicKey,
      vault: global.users.node2.vault,
      })
      .signers([global.users.node2.user])
      .rpc();
      let balanceAfter = await utils.getTokenBalance(global.provider, global.users.node2.ata);
      expect(balanceAfter).to.equal(balanceBefore + c.stakeAmount);
      });
    */
  });

  describe('slash(), update_authority()', async function () {
    it('Slash', async function () {
      const stakeBefore = await global.stakingProgram.account.stakeAccount.fetch(global.users.nodes[2].stake);

      await global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({
          ...global.accounts,
          stake: global.users.nodes[2].stake,
          vault: global.users.nodes[2].vault,
        })
        .rpc();

      global.balances.user += c.slashAmount;
      global.balances.vaultStaking -= c.slashAmount;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
      const stakeAfter = await global.stakingProgram.account.stakeAccount.fetch(global.users.nodes[2].stake);
      expect(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - c.slashAmount);
    });

    it('can not slash unauthorized', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...global.accounts, authority: global.users.node1.publicKey })
        .signers([global.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('can not slash unauthorized hack 2', async function () {
      let msg = '';
      await global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({ ...global.accounts, settings: global.accounts.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Solana8ByteConstraint);
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('can update slash authority', async function () {
      await global.stakingProgram.methods
        .updateAuthority()
        .accounts({ ...global.accounts, newAuthority: global.users.node1.publicKey })
        .rpc();
      const stats = await global.stakingProgram.account.settingsAccount.fetch(global.accounts.settings);
      expect(stats.authority.toString()).to.equal(global.users.node1.publicKey.toString());
    });

    it('can slash with node 1', async function () {
      await global.stakingProgram.methods
        .slash(new anchor.BN(c.slashAmount))
        .accounts({
          ...global.accounts,
          stake: global.users.nodes[2].stake,
          authority: global.users.node1.publicKey,
          vault: global.users.nodes[2].vault,
        })
        .signers([global.users.node1.user])
        .rpc();

      global.balances.user += c.slashAmount;
      global.balances.vaultStaking -= c.slashAmount;
      await utils.assertBalancesStaking(global.provider, global.ata, global.balances);
    });

    it('can update settings authority back', async function () {
      await global.stakingProgram.methods
        .updateAuthority()
        .accounts({
          ...global.accounts,
          authority: global.users.node1.publicKey,
          newAuthority: global.accounts.authority,
        })
        .signers([global.users.node1.user])
        .rpc();
      const stats = await global.stakingProgram.account.settingsAccount.fetch(global.accounts.settings);
      expect(stats.authority.toString()).to.equal(global.accounts.authority.toString());
    });
  });
}

import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { calculateXnos, getTokenBalance } from '../utils';

export default function suite() {
  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
  });

  describe('init()', async function () {
    it('can initialize', async function () {
      this.accounts.vault = this.vaults.staking;
      await this.stakingProgram.methods.init().accounts(this.accounts).rpc();
    });
  });

  describe('stake()', async function () {
    it('can not stake too short', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.stakeAmount), new anchor.BN(this.constants.stakeDurationMin - 1))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeDurationTooShort);
    });

    it('can not stake too long', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.stakeAmount), new anchor.BN(this.constants.stakeDurationMax + 1))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeDurationTooLong);
    });

    it('can not stake too little', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.stakeMinimum - 1), new anchor.BN(this.constants.stakeDurationMax))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeAmountNotEnough);
    });

    it('can stake minimum', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.stakeMinimum), new anchor.BN(this.constants.stakeDurationMin))
        .accounts(this.accounts)
        .rpc();
      this.balances.user -= this.constants.stakeMinimum;
      this.balances.vaultStaking += this.constants.stakeMinimum;

      // test stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.amount.toNumber()).to.equal(this.constants.stakeMinimum, 'amount');
      expect(stake.vault.toString()).to.equal(this.accounts.vault.toString(), 'vault');
      expect(stake.authority.toString()).to.equal(this.accounts.authority.toString(), 'authority');
      expect(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin, 'duration');
      expect(stake.xnos.toNumber()).to.equal(
        calculateXnos(this.constants.stakeDurationMin, this.constants.stakeMinimum),
        'xnos'
      );
    });

    it('can stake maximum', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.stakeAmount), new anchor.BN(this.constants.stakeDurationMax))
        .accounts({
          ...this.accounts,
          user: this.users.user4.ata,
          authority: this.users.user4.publicKey,
          stake: this.users.user4.stake,
          vault: this.users.user4.vault,
        })
        .signers([this.users.user4.user])
        .rpc();
      this.users.user4.balance -= this.constants.stakeAmount;
      this.balances.vaultStaking += this.constants.stakeAmount;
    });

    it('can stake for node 1', async function () {
      const amount = this.constants.minimumNodeStake - 1;
      await this.stakingProgram.methods
        .stake(new anchor.BN(amount), new anchor.BN(this.constants.stakeDurationMin))
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
    });

    it('can stake for node 2, and unstake', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.minimumNodeStake), new anchor.BN(this.constants.stakeDurationMin))
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
      this.users.node2.balance -= this.constants.minimumNodeStake;
      this.balances.vaultStaking += this.constants.minimumNodeStake;
    });

    it('can stake for other nodes', async function () {
      for (const node of this.users.otherNodes) {
        await this.stakingProgram.methods
          .stake(new anchor.BN(this.constants.stakeAmount * 2), new anchor.BN(3 * this.constants.stakeDurationMin))
          .accounts({
            ...this.accounts,
            user: node.ata,
            authority: node.publicKey,
            stake: node.stake,
            vault: node.vault,
          })
          .signers([node.user])
          .rpc();
        this.balances.vaultStaking += this.constants.stakeAmount * 2;
        node.balance -= this.constants.stakeAmount * 2;
        expect(await getTokenBalance(this.provider, node.ata)).to.equal(node.balance);
      }
    });
  });

  describe('extend()', async function () {
    it('can extend with negative duration', async function () {
      const accountBefore = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      await this.stakingProgram.methods.extend(new anchor.BN(-7)).accounts(this.accounts).rpc();
      const accountAfter = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
    });

    it('can not extend a stake that is too long', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .extend(new anchor.BN(this.constants.stakeDurationMax))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeDurationTooLong);
    });

    it('can extend a stake', async function () {
      await this.stakingProgram.methods
        .extend(new anchor.BN(this.constants.stakeDurationMin))
        .accounts(this.accounts)
        .rpc();

      // check stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin * 2 + 7);
      expect(stake.amount.toNumber()).to.equal(this.constants.stakeMinimum);
      expect(stake.xnos.toNumber()).to.equal(
        calculateXnos(this.constants.stakeDurationMin * 2 + 7, this.constants.stakeMinimum),
        'xnos'
      );
    });
  });

  describe('unstake()', async function () {
    it('can unstake from other account', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .unstake()
        .accounts({ ...this.accounts, authority: this.users.user3.publicKey })
        .signers([this.users.user3.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can not unstake with invalid reward account', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.accounts,
          reward: anchor.web3.Keypair.generate().publicKey,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.InvalidAccount);

      await this.stakingProgram.methods
        .unstake()
        .accounts({
          ...this.accounts,
          reward: this.accounts.stake,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeHasReward);
    });

    it('can unstake', async function () {
      await this.stakingProgram.methods.unstake().accounts(this.accounts).rpc();
      const data = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 3);

      // check stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.xnos.toNumber()).to.equal(0);
    });
  });

  describe('topup(), restake()', async function () {
    it('can not topup after unstake', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .topup(new anchor.BN(this.constants.stakeAmount))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeAlreadyUnstaked);
    });

    it('can restake', async function () {
      await this.stakingProgram.methods.restake().accounts(this.accounts).rpc();
    });

    it('can topup', async function () {
      await this.stakingProgram.methods.topup(new anchor.BN(this.constants.stakeAmount)).accounts(this.accounts).rpc();
      this.balances.user -= this.constants.stakeAmount;
      this.balances.vaultStaking += this.constants.stakeAmount;

      // check stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin * 2 + 7, 'duration');
      expect(stake.amount.toNumber()).to.equal(this.constants.stakeMinimum + this.constants.stakeAmount, 'amount');
      expect(stake.xnos.toNumber()).to.equal(
        calculateXnos(
          this.constants.stakeDurationMin * 2 + 7,
          this.constants.stakeMinimum + this.constants.stakeAmount
        ),
        'xnos'
      );
    });
  });

  describe('close()', async function () {
    it('can not close before unstake', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .close()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeNotUnstaked);
    });

    it('can unstake', async function () {
      await this.stakingProgram.methods.unstake().accounts(this.accounts).rpc();
    });

    it('can not close after too soon unstake', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .close()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.StakeLocked);
      await this.stakingProgram.methods.restake().accounts(this.accounts).rpc();
    });

    //
    //  To run this test you will have to modify claim.rs and change stake.duration to 5 seconds:
    //
    //          constraint = stake.time_unstake + i64::try_from(5).unwrap() <
    //                                                          ^

    /*
    it('Claim after unstake duration', async function () {
      let balanceBefore = await getTokenBalance(this.provider, this.users.node2.ata);
      await sleep(5000);
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
      let balanceAfter = await getTokenBalance(this.provider, this.users.node2.ata);
      expect(balanceAfter).to.equal(balanceBefore + this.constants.stakeAmount);
    });

     */
  });

  describe('slash(), update_authority()', async function () {
    it('can slash', async function () {
      const stakeBefore = await this.stakingProgram.account.stakeAccount.fetch(this.users.nodes[2].stake);

      await this.stakingProgram.methods
        .slash(new anchor.BN(this.constants.slashAmount))
        .accounts({
          ...this.accounts,
          stake: this.users.nodes[2].stake,
          vault: this.users.nodes[2].vault,
        })
        .rpc();

      this.balances.user += this.constants.slashAmount;
      this.balances.vaultStaking -= this.constants.slashAmount;
      const stakeAfter = await this.stakingProgram.account.stakeAccount.fetch(this.users.nodes[2].stake);
      expect(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - this.constants.slashAmount);
    });

    it('can not slash unauthorized', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .slash(new anchor.BN(this.constants.slashAmount))
        .accounts({ ...this.accounts, authority: this.users.node1.publicKey })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can not slash unauthorized hack 2', async function () {
      let msg = '';
      await this.stakingProgram.methods
        .slash(new anchor.BN(this.constants.slashAmount))
        .accounts({ ...this.accounts, settings: this.accounts.stake })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Solana8ByteConstraint);
    });

    it('can update slash authority', async function () {
      await this.stakingProgram.methods
        .updateSettings()
        .accounts({ ...this.accounts, newAuthority: this.users.node1.publicKey })
        .rpc();
      const stats = await this.stakingProgram.account.settingsAccount.fetch(this.accounts.settings);
      expect(stats.authority.toString()).to.equal(this.users.node1.publicKey.toString());
    });

    it('can slash with node 1', async function () {
      await this.stakingProgram.methods
        .slash(new anchor.BN(this.constants.slashAmount))
        .accounts({
          ...this.accounts,
          stake: this.users.nodes[2].stake,
          authority: this.users.node1.publicKey,
          vault: this.users.nodes[2].vault,
        })
        .signers([this.users.node1.user])
        .rpc();

      this.balances.user += this.constants.slashAmount;
      this.balances.vaultStaking -= this.constants.slashAmount;
    });

    it('can update settings authority back', async function () {
      await this.stakingProgram.methods
        .updateSettings()
        .accounts({
          ...this.accounts,
          authority: this.users.node1.publicKey,
          newAuthority: this.accounts.authority,
        })
        .signers([this.users.node1.user])
        .rpc();
      const stats = await this.stakingProgram.account.settingsAccount.fetch(this.accounts.settings);
      expect(stats.authority.toString()).to.equal(this.accounts.authority.toString());
    });
  });
}

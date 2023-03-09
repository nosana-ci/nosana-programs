import * as anchor from '@coral-xyz/anchor';
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
    it('can stake minimum', async function () {
      await this.stakingProgram.methods
        .stake(new anchor.BN(this.constants.minimumNodeStake), new anchor.BN(this.constants.stakeDurationMin))
        .accounts(this.accounts)
        .rpc();
      this.balances.user -= this.constants.minimumNodeStake;
      this.balances.vaultStaking += this.constants.minimumNodeStake;

      // test stake
      const stake = await this.stakingProgram.account.stakeAccount.fetch(this.accounts.stake);
      expect(stake.amount.toNumber()).to.equal(this.constants.minimumNodeStake, 'amount');
      expect(stake.vault.toString()).to.equal(this.accounts.vault.toString(), 'vault');
      expect(stake.authority.toString()).to.equal(this.accounts.authority.toString(), 'authority');
      expect(stake.duration.toNumber()).to.equal(this.constants.stakeDurationMin, 'duration');
      expect(stake.xnos.toNumber()).to.equal(
        calculateXnos(this.constants.stakeDurationMin, this.constants.minimumNodeStake),
        'xnos'
      );
    });

    it('can stake for other nodes', async function () {
      for (const node of [this.users.node1, this.users.node2, ...this.users.otherNodes]) {
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
}

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
  });
}

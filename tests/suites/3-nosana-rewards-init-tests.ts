import { expect } from 'chai';
import { getTokenBalance } from '../utils';

export default function suite() {
  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user, 'user balance');
    expect(await getTokenBalance(this.provider, this.vaults.rewards)).to.equal(this.balances.vaultRewards, 'vault');
  });

  describe('init()', async function () {
    it('can initialize the rewards vault', async function () {
      this.accounts.vault = this.vaults.rewards;
      await this.rewardsProgram.methods.init().accounts(this.accounts).rpc();

      // test stats
      const stats = await this.rewardsProgram.account.reflectionAccount.fetch(this.accounts.reflection);
      expect(stats.totalXnos.toString()).to.equal(this.total.xnos.toString());
      expect(stats.totalReflection.toString()).to.equal(this.total.reflection.toString());
      expect(stats.rate.toString()).to.equal(this.constants.initialRate.toString());
    });
  });
}

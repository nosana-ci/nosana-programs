import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import { getTokenBalance, pda, sleep, now } from '../utils';
import { afterEach, Context } from 'mocha';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { transfer } from '@solana/spl-token';

/**
 * Function to add additional funds to the vault from the pool
 * @param mochaContext
 * @param amount
 */
async function fundPool(mochaContext: Context, amount: number) {
  await transfer(
    mochaContext.connection,
    mochaContext.payer,
    mochaContext.accounts.user,
    mochaContext.vaults.pools,
    mochaContext.payer,
    amount
  );
  mochaContext.balances.user -= amount;
  mochaContext.balances.vaultPool += amount;
}

/**
 * Function to fetch the pool account
 * @param mochaContext
 */
async function getPool(mochaContext: Context) {
  return await mochaContext.poolsProgram.account.poolAccount.fetch(mochaContext.accounts.pool);
}

/**
 *
 */
export default function suite() {
  beforeEach(async function () {
    if (this.exists.pool) this.poolsBalanceBefore = await getTokenBalance(this.provider, this.vaults.pools);
    this.rewardsBalanceBefore = await getTokenBalance(this.provider, this.vaults.rewards);
  });

  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user, 'user');
    if (this.exists.pool)
      expect(await getTokenBalance(this.provider, this.vaults.pools)).to.equal(this.balances.vaultPool, 'vaultPool');
    expect(await getTokenBalance(this.provider, this.vaults.rewards)).to.equal(
      this.balances.vaultRewards,
      'vaultRewards'
    );
  });

  describe('open()', async function () {
    it('can open a pool', async function () {
      // define pool account
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.pool = throwAwayKeypair.publicKey;
      this.vaults.pools = await pda([utf8.encode('vault'), this.accounts.pool.toBuffer()], this.poolsProgram.programId);
      this.accounts.vault = this.vaults.pools;
      this.exists.pool = true;

      // start pool 3 second ago
      const startTime = now() - 3;

      // open pool
      await this.poolsProgram.methods
        .open(new BN(this.constants.emission), new BN(startTime), this.constants.claimType.addFee, true)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();

      // test pool
      const pool = await getPool(this);
      expect(pool.emission.toNumber()).to.equal(this.constants.emission);
      expect(pool.startTime.toNumber()).to.equal(startTime);
      expect(pool.claimedTokens.toNumber()).to.equal(0);
      expect(pool.closeable).to.equal(true);
    });
  });

  describe('claim_fee()', async function () {
    it('can fill pool vault', async function () {
      await fundPool(this, 14);
    });

    it('can claim underfunded', async function () {
      await this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc();
      expect(this.rewardsBalanceBefore).to.equal(await getTokenBalance(this.provider, this.vaults.rewards));
    });

    it('can claim a multiple of emission', async function () {
      await fundPool(this, this.constants.emission * 3);
      await this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc();
      const rewardsBalanceAfter = await getTokenBalance(this.provider, this.vaults.rewards);
      expect(this.rewardsBalanceBefore).to.be.lessThan(rewardsBalanceAfter, 'rewards have increased');

      // update balances
      const reward = rewardsBalanceAfter - this.rewardsBalanceBefore;
      this.balances.vaultRewards += reward;
      this.balances.vaultPool -= reward;
    });

    it('can claim for full elapsed time', async function () {
      const poolsBalanceBefore = await getTokenBalance(this.provider, this.vaults.pools);

      // fund for 3 seconds
      await fundPool(this, this.constants.emission * 3);
      const pool = await getPool(this);

      // sleep at least 5 second
      await sleep(5);
      const elapsed = now() - pool.startTime.toNumber();
      expect(elapsed).to.be.above(1);

      // claim fee
      await this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc();

      // determine reward
      const reward = (await getTokenBalance(this.provider, this.vaults.rewards)) - this.rewardsBalanceBefore;
      expect(reward).to.equal(this.constants.emission * 3 + poolsBalanceBefore);
      this.balances.vaultRewards += reward;
      this.balances.vaultPool -= reward;
    });
  });

  describe('close()', async function () {
    it('can close a pool', async function () {
      const amount = await getTokenBalance(this.provider, this.accounts.vault);
      await this.poolsProgram.methods.close().accounts(this.accounts).rpc();
      this.balances.user += amount;
      this.balances.vaultPool -= amount;
      this.exists.pool = false;
    });
  });
}

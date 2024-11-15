import * as anchor from '@coral-xyz/anchor';
import { expect } from 'chai';
import { Context, describe } from 'mocha';
import { BN } from '@coral-xyz/anchor';

import { getTokenBalance, pda } from '../../utils';
/**
 * Helper to set the job accounts and seeds
 * @param mochaContext
 * @param dummy
 */
function getRunKey(mochaContext: Context) {
  const key = anchor.web3.Keypair.generate();
  mochaContext.accounts.run = key.publicKey;
  return key;
}

/**
 * Helper to set the job accounts and seeds
 * @param mochaContext
 */
function getNewJobKey(mochaContext: Context) {
  const key = anchor.web3.Keypair.generate();
  mochaContext.accounts.job = key.publicKey;
  return key;
}

export default function suite() {
  afterEach(async function () {
    if (!this.exists.market) return;
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user, 'userBalance');
    expect(await getTokenBalance(this.provider, this.vaults.jobs)).to.equal(this.balances.vaultJob, 'vaultBalance');

    const market = await this.jobsProgram.account.marketAccount.fetch(this.market.address);
    expect(market.queueType).to.equal(this.market.queueType, 'queueType');
    expect(market.jobExpiration.toNumber()).to.equal(this.market.jobExpiration, 'jobExpiration');
    expect(market.jobPrice.toNumber()).to.equal(this.market.jobPrice, 'jobPrice');
    expect(market.jobTimeout.toNumber()).to.equal(this.market.jobTimeout, 'jobTimeout');
    expect(market.jobType).to.equal(this.market.jobType, 'jobType');
    expect(market.nodeXnosMinimum.toNumber()).to.equal(this.market.nodeStakeMinimum, 'nodeStakeMinimum');
    expect(market.nodeAccessKey.toString()).to.equal(this.market.nodeAccessKey.toString(), 'nodeAccessKey');
    expect(market.queueType).to.equal(this.market.queueType, 'queueType');
    expect((market.queue as []).length).to.equal(this.market.queueLength, 'length');
  });

  describe('open()', async function () {
    it('can open a market and vault', async function () {
      const marketKey = anchor.web3.Keypair.generate();
      this.accounts.market = marketKey.publicKey;
      this.market.address = this.accounts.market;
      this.accounts.vault = await pda(
        [this.accounts.market.toBuffer(), this.accounts.mint.toBuffer()],
        this.jobsProgram.programId,
      );
      this.vaults.jobs = this.accounts.vault;
      this.exists.market = true;

      await this.jobsProgram.methods
        .open(
          new BN(this.market.jobExpiration),
          new BN(this.market.jobPrice),
          new BN(this.market.jobTimeout),
          this.market.jobType,
          new BN(this.market.nodeStakeMinimum),
        )
        .accounts(this.accounts)
        .signers([marketKey])
        .rpc();
    });
  });

  let jobKey: anchor.web3.Keypair;
  let runKey: anchor.web3.Keypair;
  describe('list()', async function () {
    it('can list a job when there are no nodes', async function () {
      jobKey = getNewJobKey(this);
      runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= deposit / this.constants.feePercentage;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });
  });

  describe('cancel()', async function () {
    it('should match unstarted job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);

      expect(job.state).eq(0);
      expect(job.timeEnd.toNumber()).eq(0);
      expect(market.queue.length).eq(1);
      expect(market.queue[0].toString()).eq(this.accounts.job.toString());
    });

    it('should show job as stopped and with a new endtime', async function () {
      await this.jobsProgram.methods.cancel().accounts(this.accounts).rpc();
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.state).eq(3);
      expect(job.timeEnd.toNumber()).gt(0);

      expect(this.balances.vaultJob).eq(5000000);
      expect(this.balances.user).eq(9989994500000);
    });
  });
}

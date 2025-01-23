import * as anchor from '@coral-xyz/anchor';
import { expect } from 'chai';
import { buf2hex, getTimestamp, getTokenBalance, pda, sleep } from '../../utils';
import { BN } from '@coral-xyz/anchor';
import { Context, describe } from 'mocha';
import { createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';

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

  describe('work()', async function () {
    it('add node1 to market queue', async function () {
      const key = getRunKey(this);

      await this.jobsProgram.methods
        .work()
        .accounts({
          ...this.accounts,
          stake: this.users.node1.stake,
          nft: this.users.node1.ataNft,
          metadata: this.users.node1.metadata,
          authority: this.users.node1.publicKey,
        })
        .signers([key, this.users.node1.user])
        .rpc();

      this.market.queueLength += 1;
      this.market.queueType = this.constants.queueType.node;
    });

    it('add a second node to the market queue', async function () {
      const key = getRunKey(this);

      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      this.market.queueLength += 1;
      this.market.queueType = this.constants.queueType.node;
    });
  });

  describe('assign()', async function () {
    it('should not be able to assign jobs to nodes that are not in the market queue', async function () {
      let msg = '';
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .assign(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));

      expect(msg).to.equal(this.constants.errors.NotInMarketQueue);
    });

    it('should create and assign a job directly to the node removing them from the market queue', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .assign(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts({ ...this.accounts, node: this.accounts.authority })
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= deposit / this.constants.feePercentage;
      this.balances.vaultJob += deposit;

      // update market;
      this.market.queueLength -= 1;
    });
  });
}

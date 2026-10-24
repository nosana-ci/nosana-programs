import * as anchor from '@anchor-lang/core';
import { expect } from 'chai';
import { buf2hex, getSolanaTimestamp, getTokenBalance, pda, waitForSolanaTimestamp } from '../utils';
import { BN } from '@anchor-lang/core';
import { Context, describe } from 'mocha';
import { createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import { utf8 } from '@anchor-lang/core/dist/cjs/utils/bytes';

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
      this.accounts.marketSettings = await pda(
        [utf8.encode('settings'), this.accounts.market.toBuffer()],
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
  });

  describe('work()', async function () {
    it('add a second node to the market queue', async function () {
      const key = getRunKey(this);

      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      this.market.queueLength += 1;
      this.market.queueType = this.constants.queueType.node;
    });
  });

  describe('assign()', async function () {
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
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market;
      this.market.queueLength -= 1;
    });
  });

  describe('finish', async function () {
    it('can finish the last job in the market', async function () {
      await this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc();
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;
    });
  });

  describe('stop()', async function () {
    it('remove node1 from market', async function () {
      await this.jobsProgram.methods
        .stop()
        .accounts({
          ...this.accounts,
          node: this.users.node1.publicKey,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc();

      // update market;
      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });
  });

  describe('list()', async function () {
    it('can list a job when there are no nodes', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can read a job order in the market', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue[0].toString()).to.equal(this.accounts.job.toString());
    });
  });

  describe('delist()', function () {
    const listedJobAccount = [];
    let runKey: anchor.web3.Keypair;

    it('can not be invoked with incorrect authority', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .delist()
        .accounts({ ...this.accounts, authority: this.users.user2.publicKey })
        .signers([this.users.user2.user])
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can not delist a job when market queue is not a job queue', async function () {
      let msg = '';
      runKey = getRunKey(this);

      // Pick up only job in queue to change market state to empty
      await this.jobsProgram.methods.work().accounts(this.accounts).signers([runKey]).rpc();

      await this.jobsProgram.methods
        .delist()
        .accounts(this.accounts)
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      this.market.queueLength = 0;
      this.market.queueType = this.constants.queueType.unknown;

      expect(msg).to.equal(this.constants.errors.MarketInWrongState);
    });

    it('can not delist a job not in the market queue', async function () {
      // remember current job accounts
      listedJobAccount.push(this.accounts.job);

      let msg = '';

      // LIST NEW JOB TO ENSURE MARKET REMAINS JOB QUEUE
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);

      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      listedJobAccount.push(this.accounts.job);

      await this.jobsProgram.methods
        .delist()
        .accounts({ ...this.accounts, job: listedJobAccount[0] })
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.equal(this.constants.errors.NotInMarketQueue);

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      this.market.queueLength = 1;
      this.market.queueType = this.constants.queueType.job;
    });

    it('can not delist a job without a queued state', async function () {
      let msg = '';

      // Complete job to change job state
      await this.jobsProgram.methods
        .finish(this.constants.ipfsData)
        .accounts({ ...this.accounts, job: listedJobAccount[0], run: runKey.publicKey })
        .rpc();

      await this.jobsProgram.methods
        .delist()
        .accounts({ ...this.accounts, job: listedJobAccount[0] })
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.equal(this.constants.errors.JobInWrongState);

      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;
    });

    it('can close job account, refund payer and remove job from the market', async function () {
      await this.jobsProgram.methods.delist().accounts(this.accounts).rpc();

      let msg = '';
      await this.jobsProgram.account.jobAccount
        .fetch(this.accounts.job)
        .catch((err: unknown) => (msg = (err as Error).message));

      expect(msg).contain('Account does not exist or has no data');

      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;
    });
  });

  describe('list()', async function () {
    it('can list a job when there are no nodes', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can read a job order in the market', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue[0].toString()).to.equal(this.accounts.job.toString());
    });
  });

  describe('end()', async function () {
    it('can not end a job without a run account', async function () {
      let error;
      await this.jobsProgram.methods
        .end()
        .accounts(this.accounts)
        .rpc()
        .catch((err) => (error = err.error));

      expect(error.errorMessage).to.equal(this.constants.errors.SolanaAccountNotInitialized);
      expect(error.origin).to.equal('run');
    });
  });

  describe('work()', async function () {
    it('can work on job, with a new run key', async function () {
      const key = getRunKey(this);

      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });
  });

  describe('complete()', async function () {
    it('cannot complete a running job', async function () {
      let msg = '';

      await this.jobsProgram.methods
        .complete(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.eq(this.constants.errors.JobInWrongState);
    });
  });

  describe('end()', async function () {
    it('can not be invoked with incorrect authority', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .end()
        .accounts({ ...this.accounts, authority: this.users.user2.publicKey })
        .signers([this.users.user2.user])
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.eq(this.constants.errors.Unauthorized);
    });

    it('can end a running job', async function () {
      await this.jobsProgram.methods.end().accounts(this.accounts).rpc();

      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);

      expect(job.state).eq(2);

      let msg = '';
      await this.jobsProgram.account.runAccount
        .fetch(this.accounts.run)
        .catch((err: unknown) => (msg = (err as Error).message));

      expect(msg).contain('Account does not exist or has no data');

      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;
    });
  });

  describe('complete()', async function () {
    it('cannot complete a job without being the node', async function () {
      let msg = '';

      await this.jobsProgram.methods
        .complete(this.constants.ipfsData)
        .accounts({ ...this.accounts, authority: this.users.user2.publicKey })
        .signers([this.users.user2.user])
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.eq(this.constants.errors.Unauthorized);
    });

    it('can complete a job', async function () {
      const jobBefore = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);

      await this.jobsProgram.methods
        .complete(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((err) => console.error(err));

      const jobAfter = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);

      expect(jobBefore.ipfsResult).not.eq(this.constants.ipfsData);
      expect(jobAfter.ipfsResult).not.eq(this.constants.ipfsData);
    });
  });

  describe('list()', async function () {
    it('can list a job when there are no nodes', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can read a job order in the market', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue[0].toString()).to.equal(this.accounts.job.toString());
    });
  });

  describe('extend()', async function () {
    it('can extend and topup job timeout', async function () {
      await this.jobsProgram.methods
        .extend(new BN(this.constants.jobTimeout + this.constants.jobExtendTimeout))
        .accounts(this.accounts)
        .rpc();

      // update balances
      const topup = this.constants.jobPrice * this.constants.jobExtendTimeout;
      this.balances.user -= topup;
      this.balances.user -= this.constants.feePercentage ? topup / this.constants.feePercentage : 0;
      this.balances.vaultJob += topup;
    });
    it('cannot extend with a smaller timeout', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .extend(new BN(this.constants.jobTimeout - this.constants.jobExtendTimeout))
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));

      expect(msg).to.equal(this.constants.errors.JobTimeoutNotGreater);
    });
  });

  describe('work()', async function () {
    it('can work on job, with a new run key', async function () {
      const key = getRunKey(this);

      this.market.usedKey = key; // remember for later

      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });

    it('can fetch the created run account', async function () {
      const run = await this.jobsProgram.account.runAccount.fetch(this.accounts.run);
      expect(run.node.toString()).to.equal(this.accounts.authority.toString());
      expect(run.job.toString()).to.equal(this.accounts.job.toString());
      expect(run.time.toNumber()).to.not.equal(0);
    });

    it('can fetch the created job account', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.state).to.equal(this.constants.jobState.queued);
      expect(job.project.toString()).to.equal(this.accounts.authority.toString());
      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.market.toString()).to.equal(this.accounts.market.toString());
      expect(job.price.toNumber()).to.equal(new BN(this.constants.jobPrice).toNumber());
      expect(job.timeEnd.toNumber()).to.equal(0);
      expect(buf2hex(job.ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });

    it('can not work and enter the market queue without access key', async function () {
      // temp send NFT to second node
      const node2ata = await createAssociatedTokenAccount(
        this.connection,
        this.payer,
        this.accounts.nftMint,
        this.users.node2.publicKey,
      );
      await transfer(this.connection, this.payer, this.accounts.nft, node2ata, this.payer, 1);

      // work
      let msg = '';
      const key = getRunKey(this);
      await this.jobsProgram.methods
        .work()
        .accounts(this.accounts)
        .signers([key])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeNftInvalidAmount);
    });

    it('can work and enter the market queue as a node', async function () {
      // send back NFT from second node
      const node2ata = await getAssociatedTokenAddress(this.accounts.nftMint, this.users.node2.publicKey);
      await transfer(this.connection, this.payer, node2ata, this.accounts.nft, this.users.node2.user, 1);

      // work
      const key = getRunKey(this);
      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      // update market
      this.market.queueType = this.constants.queueType.node;
      this.market.queueLength += 1;
    });

    it('can not work and enter the market queue twice', async function () {
      let msg = '';
      const key = getRunKey(this);
      await this.jobsProgram.methods
        .work()
        .accounts(this.accounts)
        .signers([key])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeAlreadyQueued);
    });

    it('can fetch a market with a node queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue[0].toString()).to.equal(this.accounts.authority.toString());
    });
  });

  describe('list()', async function () {
    it('can create a job account with a new seed', async function () {
      const runKey = getRunKey(this);
      const jobKey = getNewJobKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;

      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;
    });

    it('can fetch a running job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.state).to.equal(this.constants.jobState.queued);
      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.project.toString()).to.equal(this.accounts.authority.toString());
      expect(job.timeStart.toNumber()).to.equal(0);
      expect(job.timeEnd.toNumber()).to.equal(0);
      expect(buf2hex(job.ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });
  });

  describe('finish()', async function () {
    it('can not finish a job from another node', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finish(this.constants.ipfsData)
        .accounts({
          ...this.accounts,
          authority: this.users.user2.publicKey,
        })
        .signers([this.users.user2.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can not finish a job with null result', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finish(this.constants.ipfsNull)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobResultNull);
    });

    it('can finish a job as a node', async function () {
      await this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc();
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;
    });

    it('can not finish job that is already finished', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finish(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.SolanaAccountNotInitialized);
    });

    it('can fetch a finished job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(buf2hex(job.ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });
  });

  describe('complete()', async function () {
    it('cannot complete a finished job that contains results', async function () {
      let msg = '';

      await this.jobsProgram.methods
        .complete(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((err) => (msg = err.error.errorMessage));

      expect(msg).to.eq(this.constants.errors.JobResultsAlreadySet);
    });
  });

  describe('clean()', async function () {
    it('can find a running job in the market', async function () {
      // find offsets here: https://docs.nosana.io/programs/jobs.html#accounts
      const runs = await this.jobsProgram.account.runAccount.all([
        { memcmp: { offset: 8 + 32, bytes: this.accounts.authority.toBase58() } },
      ]);

      expect(runs.length).to.equal(1);

      const job = await this.jobsProgram.account.jobAccount.fetch(runs[0].account.job);

      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.state).to.not.equal(this.constants.jobState.done);

      this.accounts.job = runs[0].account.job;
    });

    it('can not recover the funds from a running job', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .recover()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobInWrongState);
    });

    it('can not clean job that is running', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .clean()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobInWrongState);
    });

    it('can find a finished job in the market', async function () {
      // find offsets here: https://docs.nosana.io/programs/jobs.html#accounts
      const jobs = await this.jobsProgram.account.jobAccount.all([{ memcmp: { offset: 208, bytes: '3' } }]);

      expect(jobs.length).to.equal(4);

      // all() returns accounts in no particular order, pick the most recently
      // finished job so it can not have expired yet
      const job = jobs.reduce((newest, j) =>
        j.account.timeEnd.toNumber() > newest.account.timeEnd.toNumber() ? j : newest,
      );

      expect(job.account.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.account.state).to.equal(this.constants.jobState.done);

      this.accounts.job = job.publicKey;
    });

    it('can not clean job too soon', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .clean()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobNotExpired);
    });

    it('can clean job after wait', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);

      expect(market.jobExpiration.toNumber()).to.equal(this.constants.jobExpiration);
      expect(job.timeEnd.toNumber()).to.be.closeTo(await getSolanaTimestamp(this.connection), 5);

      // the program checks expiration against the on-chain clock, which drifts
      // from wall time on a test validator, so wait for the chain to pass it
      await waitForSolanaTimestamp(this.connection, job.timeEnd.toNumber() + market.jobExpiration.toNumber());
      await this.jobsProgram.methods.clean().accounts(this.accounts).rpc();
    });
  });

  describe('quit()', async function () {
    it('can list a job', async function () {
      const runKey = getRunKey(this);
      const jobKey = getNewJobKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can start working on it', async function () {
      const key = getRunKey(this);
      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;
    });

    it('can not quit a job for another node', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .quit()
        .accounts({
          ...this.accounts,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can quit a job', async function () {
      await this.jobsProgram.methods.quit().accounts(this.accounts).rpc();
    });

    it('can find a quited job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.state).to.equal(this.constants.jobState.stopped);
    });
  });

  describe('stop()', async function () {
    it('cannot stop if market is in the wrong state', async function () {
      let msg: string;

      await this.jobsProgram.methods
        .stop()
        .accounts({
          ...this.accounts,
          node: this.accounts.authority,
        })
        .rpc()
        .catch(({ error: { errorMessage } }) => (msg = errorMessage));

      expect(msg).eq(this.constants.errors.MarketInWrongState);
    });
  });

  describe('work()', async function () {
    it('can work on job, with a new run key', async function () {
      const key = getRunKey(this);

      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      this.market.queueLength += 1;
      this.market.queueType = this.constants.queueType.node;
    });
  });

  describe('stop()', async function () {
    it('cannot stop if account is not within the markets node queue', async function () {
      let msg: string;

      await this.jobsProgram.methods
        .stop()
        .accounts({
          ...this.accounts,
          node: this.users.node1.publicKey,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc()
        .catch(({ error: { errorMessage } }) => (msg = errorMessage));

      expect(msg).eq(this.constants.errors.NotInMarketQueue);
    });

    it('can stop working', async function () {
      await this.jobsProgram.methods
        .stop()
        .accounts({
          ...this.accounts,
          node: this.accounts.authority,
        })
        .rpc();

      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });

    it('can work and enter the market queue as a node 1', async function () {
      const node = this.users.node1;
      const key = getRunKey(this);

      // work
      await this.jobsProgram.methods
        .work()
        .accounts({
          ...this.accounts,
          stake: node.stake,
          nft: node.ataNft,
          metadata: node.metadata,
          authority: node.publicKey,
        })
        .signers([key, node.user])
        .rpc();

      // update market
      this.market.queueType = this.constants.queueType.node;
      this.market.queueLength += 1;
    });

    it('can not remove node 1 from the queue, by another node', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .stop()
        .accounts({
          market: this.accounts.market,
          node: this.users.node1.publicKey,
          authority: this.users.node2.publicKey,
        })
        .signers([this.users.node2.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can remove node 1 from the queue, by the market authority', async function () {
      await this.jobsProgram.methods
        .stop()
        .accounts({
          ...this.accounts,
          node: this.users.node1.publicKey,
        })
        .rpc();
      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });
  });

  describe('recover()', async function () {
    it('can not recover the funds from another project', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .recover()
        .accounts({
          ...this.accounts,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can recover a stopped job', async function () {
      await this.jobsProgram.methods.recover().accounts(this.accounts).rpc();
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;
    });
  });

  describe('different payer scenarios', async function () {
    describe('setup for different payer tests', async function () {
      it('setup user2 for different payer tests', async function () {
        // Initialize balances for user2 (our different payer)
        this.balances.user2 = await getTokenBalance(this.provider, this.users.user2.ata);
      });
    });

    describe('list() with different payer', async function () {
      it('can list a job where user2 pays but authority is the project owner', async function () {
        const jobKey = getNewJobKey(this);
        const runKey = getRunKey(this);

        // user2 is the payer, but authority remains the project owner
        await this.jobsProgram.methods
          .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
          .accounts({
            ...this.accounts,
            payer: this.users.user2.publicKey,
            user: this.users.user2.ata,
            authority: this.accounts.authority, // project owner remains the same
          })
          .signers([jobKey, runKey, this.users.user2.user])
          .rpc();

        // update balances - user2 should pay, not the original user
        const deposit = this.constants.jobPrice * this.constants.jobTimeout;
        this.balances.user2 -= deposit;
        this.balances.user2 -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
        this.balances.vaultJob += deposit;

        // verify the original user's balance is unchanged
        expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);

        // verify user2's balance has changed
        expect(await getTokenBalance(this.provider, this.users.user2.ata)).to.equal(this.balances.user2);

        // update market
        this.market.queueType = this.constants.queueType.job;
        this.market.queueLength += 1;
      });

      it('can verify job is owned by the correct authority, not the payer', async function () {
        const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);

        // Job should be owned by the authority, not the payer
        expect(job.project.toString()).to.equal(this.accounts.authority.toString());
        expect(job.project.toString()).to.not.equal(this.users.user2.publicKey.toString());

        // But the payer should be recorded as user2
        expect(job.payer.toString()).to.equal(this.users.user2.publicKey.toString());
      });

      it('can only delist job as the authority, not the payer', async function () {
        let msg = '';

        // user2 (payer) should not be able to delist
        await this.jobsProgram.methods
          .delist()
          .accounts({
            ...this.accounts,
            payer: this.users.user2.publicKey,
            deposit: this.users.user2.ata,
            authority: this.users.user2.publicKey,
          })
          .signers([this.users.user2.user])
          .rpc()
          .catch((err) => (msg = err.error.errorMessage));

        expect(msg).to.equal(this.constants.errors.Unauthorized);

        // authority should be able to delist
        await this.jobsProgram.methods
          .delist()
          .accounts({
            ...this.accounts,
            payer: this.users.user2.publicKey,
            deposit: this.users.user2.ata,
          })
          .rpc();

        // verify user2 gets refunded (as the payer)
        const deposit = this.constants.jobPrice * this.constants.jobTimeout;
        this.balances.user2 += deposit;
        this.balances.vaultJob -= deposit;

        expect(await getTokenBalance(this.provider, this.users.user2.ata)).to.equal(this.balances.user2);

        // update market
        this.market.queueType = this.constants.queueType.unknown;
        this.market.queueLength -= 1;
      });
    });

    describe('extend() with different payer', async function () {
      it('can list a job with user2 as payer', async function () {
        const jobKey = getNewJobKey(this);
        const runKey = getRunKey(this);

        await this.jobsProgram.methods
          .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
          .accounts({
            ...this.accounts,
            payer: this.users.user2.publicKey,
            user: this.users.user2.ata,
            authority: this.accounts.authority,
          })
          .signers([jobKey, runKey, this.users.user2.user])
          .rpc();

        // update balances
        const deposit = this.constants.jobPrice * this.constants.jobTimeout;
        this.balances.user2 -= deposit;
        this.balances.user2 -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
        this.balances.vaultJob += deposit;

        // update market
        this.market.queueType = this.constants.queueType.job;
        this.market.queueLength += 1;
      });

      it('can extend job timeout and charge the original payer', async function () {
        await this.jobsProgram.methods
          .extend(new BN(this.constants.jobTimeout + this.constants.jobExtendTimeout))
          .accounts({
            ...this.accounts,
            payer: this.users.user2.publicKey,
            user: this.users.user2.ata,
          })
          .signers([this.users.user2.user])
          .rpc();

        // update balances - user2 should pay for extension
        const topup = this.constants.jobPrice * this.constants.jobExtendTimeout;
        this.balances.user2 -= topup;
        this.balances.user2 -= this.constants.feePercentage ? topup / this.constants.feePercentage : 0;
        this.balances.vaultJob += topup;

        expect(await getTokenBalance(this.provider, this.users.user2.ata)).to.equal(this.balances.user2);
      });

      it('can work on extended job and finish it', async function () {
        const workKey = getRunKey(this);
        await this.jobsProgram.methods.work().accounts(this.accounts).signers([workKey]).rpc();

        // update market
        this.market.queueLength -= 1;
        this.market.queueType = this.constants.queueType.unknown;
        // make sure we take the entire job timeout, according to the on-chain
        // clock that the reimbursement is calculated with
        const run = await this.jobsProgram.account.runAccount.fetch(this.accounts.run);
        await waitForSolanaTimestamp(
          this.connection,
          run.time.toNumber() + this.constants.jobTimeout + this.constants.jobExtendTimeout,
        );
        // finish the job
        await this.jobsProgram.methods
          .finish(this.constants.ipfsData)
          .accounts({
            ...this.accounts,
            payerJob: this.users.user2.publicKey,
            deposit: this.users.user2.ata,
          })
          .rpc();

        const deposit = this.constants.jobPrice * (this.constants.jobTimeout + this.constants.jobExtendTimeout);

        this.balances.user += deposit;
        this.balances.vaultJob -= deposit;
      });
    });
  });

  describe('project access key', async function () {
    it('can list a job on an open market as a client built before market settings existed', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      const instruction = await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .instruction();
      // such a client does not pass the trailing market settings and project access key accounts
      instruction.keys = instruction.keys.slice(0, -3);
      await this.provider.sendAndConfirm(new anchor.web3.Transaction().add(instruction), [jobKey, runKey]);

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can delist the job again', async function () {
      await this.jobsProgram.methods.delist().accounts(this.accounts).rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;
    });

    it('can not update the market settings with a different authority', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .setSettings()
        .accounts({
          ...this.accounts,
          projectAccessKey: this.nftConfig.collection,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can restrict a market to projects holding an access key', async function () {
      await this.jobsProgram.methods
        .setSettings()
        .accounts({ ...this.accounts, projectAccessKey: this.nftConfig.collection })
        .rpc();

      const settings = await this.jobsProgram.account.marketSettingsAccount.fetch(this.accounts.marketSettings);
      expect(settings.projectAccessKey.toString()).to.equal(this.nftConfig.collection.toString());

      // the market itself is flagged as restricted
      this.market.jobType |= this.constants.marketRestricted;
    });

    it('keeps the market restricted when it is updated', async function () {
      await this.jobsProgram.methods
        .update(
          new BN(this.market.jobExpiration),
          new BN(this.market.jobPrice),
          this.market.jobType & ~this.constants.marketRestricted,
          new BN(this.market.nodeStakeMinimum),
          new BN(this.market.jobTimeout),
        )
        .accounts({ ...this.accounts, accessKey: this.market.nodeAccessKey })
        .rpc();
    });

    it('can not list a job on a restricted market as a client built before market settings existed', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      const instruction = await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .instruction();
      instruction.keys = instruction.keys.slice(0, -3);

      let msg = '';
      await this.provider
        .sendAndConfirm(new anchor.web3.Transaction().add(instruction), [jobKey, runKey])
        .catch((e) => (msg = [e.message, ...(e.logs ?? [])].join('\n')));
      expect(msg).to.contain(this.constants.errors.AccessKeyMissing);
    });

    it('can not list a job without a project access key', async function () {
      let msg = '';
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.AccessKeyMissing);
    });

    it('can not list a job with an access key owned by someone else', async function () {
      let msg = '';
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts({
          ...this.accounts,
          projectNft: this.users.node1.ataNft,
          projectMetadata: this.users.node1.metadata,
        })
        .signers([jobKey, runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.AccessNftWrongOwner);
    });

    it('can not list a job with metadata that does not belong to the access key', async function () {
      let msg = '';
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts({
          ...this.accounts,
          projectNft: this.accounts.nft,
          projectMetadata: this.users.node1.metadata,
        })
        .signers([jobKey, runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.AccessKeyInvalidCollection);
    });

    it('can not assign a job without a project access key', async function () {
      // node1 enters the queue, so there is a node to assign to
      const workKey = getRunKey(this);
      await this.jobsProgram.methods
        .work()
        .accounts({
          ...this.accounts,
          stake: this.users.node1.stake,
          nft: this.users.node1.ataNft,
          metadata: this.users.node1.metadata,
          authority: this.users.node1.publicKey,
        })
        .signers([workKey, this.users.node1.user])
        .rpc();
      this.market.queueLength += 1;
      this.market.queueType = this.constants.queueType.node;

      let msg = '';
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .assign(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts({ ...this.accounts, node: this.users.node1.publicKey })
        .signers([jobKey, runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.AccessKeyMissing);

      // remove node1 from the queue again
      await this.jobsProgram.methods
        .stop()
        .accounts({ ...this.accounts, node: this.users.node1.publicKey })
        .rpc();
      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });

    it('can list a job with a project access key', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts({
          ...this.accounts,
          projectNft: this.accounts.nft,
          projectMetadata: this.accounts.metadata,
        })
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can delist the job again', async function () {
      await this.jobsProgram.methods.delist().accounts(this.accounts).rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;
    });

    it('can not close the market settings with a different authority', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .closeSettings()
        .accounts({ ...this.accounts, authority: this.users.node1.publicKey })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can open the market for all projects again by closing the settings', async function () {
      await this.jobsProgram.methods.closeSettings().accounts(this.accounts).rpc();

      const settings = await this.jobsProgram.account.marketSettingsAccount.fetchNullable(this.accounts.marketSettings);
      expect(settings).to.equal(null);

      // the market is open again
      this.market.jobType &= ~this.constants.marketRestricted;
    });

    it('can list a job without a project access key again', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData, new BN(this.constants.jobTimeout))
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user -= deposit;
      this.balances.user -= this.constants.feePercentage ? deposit / this.constants.feePercentage : 0;
      this.balances.vaultJob += deposit;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can delist the job again', async function () {
      await this.jobsProgram.methods.delist().accounts(this.accounts).rpc();

      // update balances
      const deposit = this.constants.jobPrice * this.constants.jobTimeout;
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;
    });
  });

  describe('update()', async function () {
    it('can update a market', async function () {
      this.market.jobPrice = 100_000 * this.constants.decimals;
      this.market.nodeStakeMinimum = 1_000_000 * this.constants.decimals;
      this.market.jobType = this.constants.jobType.gpu;
      this.market.nodeAccessKey = this.accounts.systemProgram;
      this.market.jobTimeout = 2 * this.market.jobTimeout;

      await this.jobsProgram.methods
        .update(
          new BN(this.market.jobExpiration),
          new BN(this.market.jobPrice),
          this.market.jobType,
          new BN(this.market.nodeStakeMinimum),
          new BN(this.market.jobTimeout),
        )
        .accounts({
          ...this.accounts,
          accessKey: this.market.nodeAccessKey,
        })
        .rpc();
    });
  });
  describe('close()', async function () {
    /*
    it('can not close a market when there are tokens left', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .close()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.VaultNotEmpty);
    });

     */

    it('can find the last running job in this market', async function () {
      const runs = await this.jobsProgram.account.runAccount.all();

      expect(runs.length).to.equal(1); // also dummy account

      const run = runs.pop();

      expect(run.account.node.toString()).to.equal(this.accounts.authority.toString());
      this.accounts.run = run.publicKey;
      this.accounts.job = run.account.job;
    });

    it('can not finish another nodes job', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finish(this.constants.ipfsData)
        .accounts({
          ...this.accounts,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can finish the last job in the market', async function () {
      await this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc();
      const deposit = this.constants.jobPrice * (this.constants.jobTimeout + this.constants.jobExtendTimeout);
      this.balances.user += deposit;
      this.balances.vaultJob -= deposit;
    });

    it('can see no more running jobs in this market', async function () {
      // https://docs.nosana.io/programs/jobs.html#job-account
      const runs = await this.jobsProgram.account.runAccount.all();
      expect(runs.length).to.equal(0);
    });

    it('can not close market with different authority', async function () {
      let msg = '';
      const user = this.users.node1;
      await this.jobsProgram.methods
        .closeAdmin()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
        })
        .signers([user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can close the market', async function () {
      await this.jobsProgram.methods.close().accounts(this.accounts).rpc();
      this.exists.market = false;
    });
  });

  describe('close_admin()', async function () {
    it('can open a market and vault', async function () {
      const marketKey = anchor.web3.Keypair.generate();
      this.accounts.market = marketKey.publicKey;
      this.market.address = this.accounts.market;
      this.accounts.vault = await pda(
        [this.accounts.market.toBuffer(), this.accounts.mint.toBuffer()],
        this.jobsProgram.programId,
      );
      this.accounts.marketSettings = await pda(
        [utf8.encode('settings'), this.accounts.market.toBuffer()],
        this.jobsProgram.programId,
      );
      this.vaults.jobs = this.accounts.vault;
      this.exists.market = true;
      this.accounts.accessKey = this.accounts.systemProgram;

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

    it('can not close market without the admin key', async function () {
      let msg = '';
      const user = this.users.node1;
      await this.jobsProgram.methods
        .closeAdmin()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
        })
        .signers([user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can close the market as admin', async function () {
      await this.jobsProgram.methods.closeAdmin().accounts(this.accounts).rpc();
      this.exists.market = false;
    });
  });
}

import * as anchor from '@coral-xyz/anchor';
import { expect } from 'chai';
import { buf2hex, getTimestamp, getTokenBalance, pda, sleep } from '../utils';
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
      this.balances.user -= deposit / this.constants.feePercentage;
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
      this.balances.user -= deposit / this.constants.feePercentage;
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
      this.balances.user -= deposit / this.constants.feePercentage;
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
      this.balances.user -= deposit / this.constants.feePercentage;
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
      this.balances.user -= topup / this.constants.feePercentage;
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
      this.balances.user -= deposit / this.constants.feePercentage;
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

    it('can not claim job that is running', async function () {
      let msg = '';
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .claim()
        .accounts(this.accounts)
        .signers([runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobInWrongState);
    });

    it('can find a finished job in the market', async function () {
      // find offsets here: https://docs.nosana.io/programs/jobs.html#accounts
      const jobs = await this.jobsProgram.account.jobAccount.all([{ memcmp: { offset: 208, bytes: '3' } }]);

      expect(jobs.length).to.equal(3);

      const job = jobs[0];

      expect(job.account.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.account.state).to.equal(this.constants.jobState.done);

      this.accounts.job = jobs[2].publicKey;
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
      const now = getTimestamp();

      expect(market.jobExpiration.toNumber()).to.equal(this.constants.jobExpiration);
      expect(job.timeEnd.toNumber()).to.be.closeTo(now, 5);

      // let's add 5 seconds on the target time
      const expired = job.timeEnd.toNumber() + market.jobExpiration.toNumber() + 5;

      // wait and clean
      await sleep(Math.abs(now - expired));
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
      this.balances.user -= deposit / this.constants.feePercentage;
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

  describe('claim()', async function () {
    it('can not claim a stopped job with wrong metadata', async function () {
      let msg = '';
      const user = this.users.node1;
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          nft: user.ataNft,
          stake: user.stake,
        })
        .signers([runKey, user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeKeyInvalidCollection);
    });

    it('can not claim a stopped job with another stake', async function () {
      let msg = '';
      const user = this.users.node1;
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          metadata: user.metadata,
          nft: user.ataNft,
        })
        .signers([runKey, user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can not claim a stopped job with wrong nft', async function () {
      let msg = '';
      const user = this.users.node1;
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          metadata: user.metadata,
          stake: user.stake,
        })
        .signers([runKey, user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeNftWrongOwner);
    });

    it('can claim a stopped job with another node', async function () {
      const user = this.users.node1;
      const runKey = getRunKey(this);
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          nft: user.ataNft,
          metadata: user.metadata,
          stake: user.stake,
        })
        .signers([runKey, user.user])
        .rpc();
    });

    it('can find a re-claimed job', async function () {
      const user = this.users.node1;
      const runs = await this.jobsProgram.account.runAccount.all([
        { memcmp: { offset: 8 + 32, bytes: user.publicKey.toBase58() } },
      ]);
      expect(runs.length).to.equal(1, 'number of runs');

      const job = await this.jobsProgram.account.jobAccount.fetch(runs[0].account.job);
      expect(job.state).to.equal(this.constants.jobState.stopped);
      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());

      this.accounts.run = runs[0].publicKey;
      this.accounts.job = runs[0].account.job;
    });

    it('can not quit job for another node', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .quit()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can quit a job again', async function () {
      const user = this.users.node1;
      await this.jobsProgram.methods
        .quit()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
        })
        .signers([user.user])
        .rpc();
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

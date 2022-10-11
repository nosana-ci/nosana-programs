import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { buf2hex, getTimestamp, getTokenBalance, now, pda, sleep } from '../utils';
import { BN } from '@project-serum/anchor';
import { Context, describe } from 'mocha';

/**
 * Helper to set the job accounts and seeds
 * @param mochaContext
 * @param dummy
 */
function setRunAccountAndGetKey(mochaContext: Context, dummy = false) {
  const key = dummy ? mochaContext.market.dummyKey : anchor.web3.Keypair.generate();
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
    if (this.marketClosed) return;
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    expect(await getTokenBalance(this.provider, this.vaults.jobs)).to.equal(this.balances.vaultJob);

    const market = await this.jobsProgram.account.marketAccount.fetch(this.market.address);
    expect(market.queueType).to.equal(this.market.queueType, 'queueType');
    expect(market.jobExpiration.toNumber()).to.equal(this.market.jobExpiration, 'jobExpiration');
    expect(market.jobPrice.toNumber()).to.equal(this.market.jobPrice, 'jobPrice');
    expect(market.jobTimeout.toNumber()).to.equal(this.market.jobTimeout, 'jobTimeout');
    expect(market.jobType).to.equal(this.market.jobType, 'jobType');
    expect(market.nodeXnosMinimum.toNumber()).to.equal(this.market.nodeStakeMinimum, 'nodeStakeMinimum');
    expect(market.nodeAccessKey.toString()).to.equal(this.market.nodeAccessKey.toString(), 'nodeStakeMinimum');
    expect(market.queueType).to.equal(this.market.queueType, 'queueType');
    expect((market.queue as []).length).to.equal(this.market.queueLength, 'length');
  });

  describe('open()', async function () {
    it('can open a market, vault, and dummy job', async function () {
      const marketKey = anchor.web3.Keypair.generate();
      this.accounts.market = marketKey.publicKey;
      this.market.address = this.accounts.market;
      this.accounts.vault = await pda(
        [this.accounts.market.toBuffer(), this.accounts.mint.toBuffer()],
        this.jobsProgram.programId
      );
      this.vaults.jobs = this.accounts.vault;
      this.marketClosed = false;

      const jobKey = setRunAccountAndGetKey(this, true);
      await this.jobsProgram.methods
        .open(
          new BN(this.market.jobExpiration),
          new BN(this.market.jobPrice),
          new BN(this.market.jobTimeout),
          this.market.jobType,
          new BN(this.market.nodeStakeMinimum)
        )
        .accounts(this.accounts)
        .signers([marketKey, jobKey])
        .rpc();
    });

    it('can fetch the dummy run account', async function () {
      const run = await this.jobsProgram.account.runAccount.fetch(this.accounts.run);
      expect(run.state).to.equal(this.constants.runState.dummy);
      expect(run.node.toString()).to.equal(this.jobsProgram.programId.toString());
      expect(run.job.toString()).to.equal(this.jobsProgram.programId.toString());
      expect(run.payer.toString()).to.equal(this.jobsProgram.programId.toString());
      expect(run.time.toNumber()).to.equal(0);
    });
  });

  describe('list()', async function () {
    it('can list a job when there are no nodes', async function () {
      const jobKey = getNewJobKey(this);
      const runKey = setRunAccountAndGetKey(this, true);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update balances
      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;

      // update market
      this.market.queueType = this.constants.queueType.job;
      this.market.queueLength += 1;
    });

    it('can read a job order in the market', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue[0].toString()).to.equal(this.accounts.job.toString());
    });
  });

  describe('work()', async function () {
    it('can not start work with the dummy account', async function () {
      let msg = '';
      const key = setRunAccountAndGetKey(this, true);
      await this.jobsProgram.methods
        .work()
        .accounts(this.accounts)
        .signers([key])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.RunConstraintNotSatisfied);
    });

    it('can work on job, with a new run key', async function () {
      const key = setRunAccountAndGetKey(this);

      this.market.usedKey = key; // remember for later

      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });

    it('can fetch the craeted run account', async function () {
      const run = await this.jobsProgram.account.runAccount.fetch(this.accounts.run);
      expect(run.state).to.equal(this.constants.runState.created);
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

    it('can work and enter the market queue as a node', async function () {
      const key = setRunAccountAndGetKey(this, true);
      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();

      // update market
      this.market.queueType = this.constants.queueType.node;
      this.market.queueLength += 1;
    });

    it('can not work and enter the market queue twice', async function () {
      let msg = '';
      const key = setRunAccountAndGetKey(this, true);
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
    it('can not list job for creation with system seed', async function () {
      let msg = '';
      const runKey = setRunAccountAndGetKey(this, true);
      const jobKey = getNewJobKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.RunConstraintNotSatisfied);
    });

    it('can not list a job account with a used seed', async function () {
      let msg = '';
      const jobKey = getNewJobKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts({
          ...this.accounts,
          run: this.market.usedKey.publicKey,
        })
        .signers([jobKey, this.market.usedKey])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.RunConstraintNotSatisfied);
    });

    it('can create a job account with a new seed', async function () {
      const runKey = setRunAccountAndGetKey(this);
      const jobKey = getNewJobKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;

      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can fetch a running job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.state).to.equal(this.constants.jobState.running);
      expect(job.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.project.toString()).to.equal(this.accounts.authority.toString());
      expect(job.timeStart.toNumber()).to.be.closeTo(now(), 100);
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

    it('can finish a job as a node', async function () {
      await this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc();
      this.balances.user += this.constants.jobPrice;
      this.balances.vaultJob -= this.constants.jobPrice;
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

    it('can not claim job this is running', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .claim()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobInWrongState);
    });

    it('can find a finished job in the market', async function () {
      // find offsets here: https://docs.nosana.io/programs/jobs.html#accounts
      const jobs = await this.jobsProgram.account.jobAccount.all([{ memcmp: { offset: 208, bytes: '3' } }]);

      expect(jobs.length).to.equal(1);

      const job = jobs[0];

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
      const runKey = setRunAccountAndGetKey(this, true);
      const jobKey = getNewJobKey(this);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([jobKey, runKey])
        .rpc();

      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can start working on it', async function () {
      const key = setRunAccountAndGetKey(this, false);
      await this.jobsProgram.methods.work().accounts(this.accounts).signers([key]).rpc();
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
      expect(job.state).to.equal(this.constants.jobState.queued);
    });
  });

  /*
  describe('claim()', async function () {
    it('can not claim a stopped job with wrong metadata', async function () {
      let msg = '';
      const user = this.users.node1;
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          nft: user.ataNft,
          stake: user.stake,
        })
        .signers([user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeNftWrongMetadata);
    });

    it('can not claim a stopped job with another stake', async function () {
      let msg = '';
      const user = this.users.node1;
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          metadata: user.metadata,
          nft: user.ataNft,
        })
        .signers([user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can not claim a stopped job with wrong nft', async function () {
      let msg = '';
      const user = this.users.node1;
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          metadata: user.metadata,
          stake: user.stake,
        })
        .signers([user.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeNftWrongOwner);
    });

    it('can claim a stopped job with another node', async function () {
      const user = this.users.node1;
      await this.jobsProgram.methods
        .claim()
        .accounts({
          ...this.accounts,
          authority: user.publicKey,
          nft: user.ataNft,
          metadata: user.metadata,
          stake: user.stake,
        })
        .signers([user.user])
        .rpc();
    });

    it('can find a re-claimed job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.state).to.equal(this.constants.jobState.running);
      expect(job.node.toString()).to.equal(this.users.node1.publicKey.toString());
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
      await this.jobsProgram.methods
        .quit()
        .accounts({
          ...this.accounts,
          authority: this.users.node1.publicKey,
        })
        .signers([this.users.node1.user])
        .rpc();
    });
  });

   */

  describe('update()', async function () {
    it('can update a market', async function () {
      this.market.jobPrice = 100_000 * this.constants.decimals;
      this.market.nodeStakeMinimum = 1_000_000 * this.constants.decimals;
      this.market.jobType = this.constants.jobType.gpu;
      this.market.nodeAccessKey = this.accounts.systemProgram;

      await this.jobsProgram.methods
        .update(
          new BN(this.market.jobExpiration),
          new BN(this.market.jobPrice),
          new BN(this.market.jobTimeout),
          this.market.jobType,
          new BN(this.market.nodeStakeMinimum)
        )
        .accounts({
          ...this.accounts,
          accessKey: this.market.nodeAccessKey,
        })
        .rpc();
    });
  });

  /*
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
      this.balances.user += this.constants.jobPrice;
      this.balances.vaultJob -= this.constants.jobPrice;
    });
  });
   */

  /*
  describe('close()', async function () {
    it('can not close a market when there are tokens left', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .close()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.VaultNotEmpty);
    });

    it('can find the last running job in this market', async function () {
      const runningJobs = await this.jobsProgram.account.jobAccount.all([
        { memcmp: { offset: 72, bytes: this.accounts.market.toBase58() } },
        { memcmp: { offset: 208, bytes: '2' } },
      ]);
      expect(runningJobs.length).to.equal(1);
      this.accounts.job = runningJobs.pop().publicKey;
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
      this.balances.user += this.constants.jobPrice;
      this.balances.vaultJob -= this.constants.jobPrice;
    });

    it('can see no more running jobs in this market', async function () {
      // https://docs.nosana.io/programs/jobs.html#job-account
      const runningJobs = await this.jobsProgram.account.jobAccount.all([
        { memcmp: { offset: 72, bytes: this.accounts.market.toBase58() } },
        { memcmp: { offset: 208, bytes: '2' } },
      ]);
      expect(runningJobs.length).to.equal(0);
    });

    it('can close the market', async function () {
      await this.jobsProgram.methods.close().accounts(this.accounts).rpc();
      this.marketClosed = true;
    });
  });

   */
}

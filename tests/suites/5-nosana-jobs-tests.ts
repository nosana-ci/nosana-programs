import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { buf2hex, getTimestamp, getTokenBalance, now, pda, sleep } from '../utils';
import { BN } from '@project-serum/anchor';
import { Context } from 'mocha';

/**
 * Helper to set the job accounts and seeds
 * @param mochaContext
 * @param dummy
 * @param seed
 */
async function setJobAccountAndSeed(
  mochaContext: Context,
  dummy = false,
  seed = anchor.web3.Keypair.generate().publicKey
) {
  mochaContext.accounts.seed = dummy ? mochaContext.accounts.systemProgram : seed;
  mochaContext.accounts.job = await pda([mochaContext.accounts.seed.toBuffer()], mochaContext.jobsProgram.programId);
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
    expect(market.nodeStakeMinimum.toNumber()).to.equal(this.market.nodeStakeMinimum, 'nodeStakeMinimum');
    expect(market.nodeAccessKey.toString()).to.equal(this.market.nodeAccessKey.toString(), 'nodeStakeMinimum');
    expect(market.queueType).to.equal(this.market.queueType, 'queueType');
    expect((market.queue as []).length).to.equal(this.market.queueLength, 'length');
  });

  describe('open()', async function () {
    it('can open a market, vault, and dummy job', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.market = throwAwayKeypair.publicKey;
      this.market.address = this.accounts.market;
      this.accounts.vault = await pda(
        [this.accounts.market.toBuffer(), this.accounts.mint.toBuffer()],
        this.jobsProgram.programId
      );
      this.vaults.jobs = this.accounts.vault;
      this.marketClosed = false;
      await setJobAccountAndSeed(this, true);

      await this.jobsProgram.methods
        .open(
          new BN(this.market.jobExpiration),
          new BN(this.market.jobPrice),
          new BN(this.market.jobTimeout),
          this.market.jobType,
          new BN(this.market.nodeStakeMinimum)
        )
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();
    });

    it('can fetch the dummy / queued job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.queued);
      expect(job.project.toString()).to.equal(this.jobsProgram.programId.toString());
      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.market.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.project.toString()).to.equal(this.jobsProgram.programId.toString());
    });
  });

  describe('list()', async function () {
    it('can list a job when there are no nodes', async function () {
      await setJobAccountAndSeed(this, true);
      await this.jobsProgram.methods.list(this.constants.ipfsData).accounts(this.accounts).rpc();

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
      expect(market.queue[0].user.toString()).to.equal(this.accounts.authority.toString());
      expect(buf2hex(market.queue[0].ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });
  });

  describe('work()', async function () {
    it('can not create a job with system seed as node, because it exists', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .work()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobAccountAlreadyInitialized);
    });

    it('can work on a job with a new seed as node', async function () {
      await setJobAccountAndSeed(this);
      await this.jobsProgram.methods.work().accounts(this.accounts).rpc();

      this.market.queueLength -= 1;
      this.market.queueType = this.constants.queueType.unknown;
    });

    it('can fetch the running job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.running);
      expect(job.project.toString()).to.equal(this.accounts.authority.toString());
      expect(job.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.market.toString()).to.equal(this.accounts.market.toString());
      expect(job.price.toNumber()).to.equal(new BN(this.constants.jobPrice).toNumber());
      expect(job.timeStart.toNumber()).to.not.equal(0);
      expect(job.timeEnd.toNumber()).to.equal(0);
      expect(buf2hex(job.ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });

    it('can work and enter the market queue as a node', async function () {
      this.accounts.oldSeed = this.accounts.seed;
      await setJobAccountAndSeed(this, true);
      await this.jobsProgram.methods.work().accounts(this.accounts).rpc();

      // update market
      this.market.queueType = this.constants.queueType.node;
      this.market.queueLength += 1;
    });

    it('can not work and enter the market queue twice', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .work()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.NodeAlreadyQueued);
    });

    it('can fetch a market with a node queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue[0].user.toString()).to.equal(this.accounts.authority.toString());
    });
  });

  describe('list()', async function () {
    it('can not list job for creation with system seed', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobAccountAlreadyInitialized);
    });

    it('can not list a job account with a used seed', async function () {
      let msg = '';
      await setJobAccountAndSeed(this, false, this.accounts.oldSeed);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobAccountAlreadyInitialized);
    });

    it('can create a job account with a new seed', async function () {
      await setJobAccountAndSeed(this);
      await this.jobsProgram.methods.list(this.constants.ipfsData).accounts(this.accounts).rpc();

      // update market
      this.market.queueType = this.constants.queueType.unknown;
      this.market.queueLength -= 1;

      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can fetch a running job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.running);
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
      expect(msg).to.equal(this.constants.errors.JobInWrongState);
    });

    it('can fetch a finished job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(buf2hex(job.ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });
  });

  describe('clean()', async function () {
    it('can find a finished job in the market', async function () {
      // find offsets here: https://docs.nosana.io/programs/jobs.html#accounts
      const jobs = await this.jobsProgram.account.jobAccount.all([{ memcmp: { offset: 208, bytes: '3' } }]);

      expect(jobs.length).to.equal(1);

      const job = jobs[0];

      expect(job.account.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.account.status).to.equal(this.constants.jobStatus.done);

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

    it('can not finish anoter nodes job', async function () {
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
}

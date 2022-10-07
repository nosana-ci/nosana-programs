// noinspection JSVoidFunctionReturnValueUsed

import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { buf2hex, getTokenBalance, now, pda } from '../utils';
import { BN } from '@project-serum/anchor';
import { Context } from 'mocha';
import { PublicKey } from '@solana/web3.js';

/**
 * Helper to set the job accounts and seeds
 * @param mochaContext
 * @param seed
 */
async function setJobAccountAndSeed(mochaContext: Context, seed: PublicKey) {
  mochaContext.accounts.seed = seed;
  mochaContext.accounts.job = await pda([seed.toBuffer()], mochaContext.jobsProgram.programId);
}

export default function suite() {
  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    expect(await getTokenBalance(this.provider, this.vaults.jobs)).to.equal(this.balances.vaultJob);
  });

  describe('open()', async function () {
    it('can open a market with vault', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.market = throwAwayKeypair.publicKey;
      this.accounts.vault = await pda(
        [this.accounts.market.toBuffer(), this.accounts.mint.toBuffer()],
        this.jobsProgram.programId
      );
      await setJobAccountAndSeed(this, this.accounts.systemProgram);
      this.vaults.jobs = this.accounts.vault;

      await this.jobsProgram.methods
        .open(
          new BN(this.constants.jobExpiration),
          new BN(this.constants.jobPrice),
          new BN(this.constants.jobTimeout),
          this.constants.jobType.default,
          new BN(this.constants.stakeMinimum)
        )
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();
    });

    it('can fetch the queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      const queue = market.queue as [];
      expect(market.jobType).to.equal(this.constants.jobType.default);
      expect(market.jobTimeout.toNumber()).to.equal(this.constants.jobTimeout);
      expect(market.jobPrice.toNumber()).to.equal(this.constants.jobPrice);
      expect(market.queueType).to.equal(this.constants.queueType.unknown);
      expect(queue.length).to.equal(0);
    });

    it('can fetch a dummy / queued job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.queued);
      expect(job.project.toString()).to.equal(this.jobsProgram.programId.toString());
      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.market.toString()).to.equal(this.accounts.systemProgram.toString());
    });
  });

  describe('list()', async function () {
    it('can create a job when there are no nodes', async function () {
      await this.jobsProgram.methods.list(this.constants.ipfsData).accounts(this.accounts).rpc();

      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can fetch a market job', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      const queue = market.queue as [];
      expect(market.queueType).to.equal(this.constants.queueType.job, 'Wrong queue type');
      expect(queue.length).to.equal(1);
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
      await setJobAccountAndSeed(this, anchor.web3.Keypair.generate().publicKey);
      await this.jobsProgram.methods.work().accounts(this.accounts).rpc();
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

    it('can fetch an empty market', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      const queue = market.queue as [];
      expect(market.queueType).to.equal(this.constants.queueType.unknown, 'Wrong queue type');
      expect(queue.length).to.equal(0);
    });

    it('can work and enter the market queue as a node', async function () {
      this.accounts.oldSeed = this.accounts.seed;
      await setJobAccountAndSeed(this, this.accounts.systemProgram);
      await this.jobsProgram.methods.work().accounts(this.accounts).rpc();
    });

    it('can fetch a market with a node queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      const queue = market.queue as [];
      expect(market.queueType).to.equal(this.constants.queueType.node, 'Wrong queue type');
      expect(queue.length).to.equal(1);
      expect(market.queue[0].user.toString()).to.equal(this.accounts.authority.toString());
    });
  });

  describe('list()', async function () {
    it('can not list job account with the system seed', async function () {
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
      await setJobAccountAndSeed(this, this.accounts.oldSeed);
      await this.jobsProgram.methods
        .list(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobAccountAlreadyInitialized);
    });

    it('can create a job account with a new seed', async function () {
      await setJobAccountAndSeed(this, anchor.web3.Keypair.generate().publicKey);
      await this.jobsProgram.methods.list(this.constants.ipfsData).accounts(this.accounts).rpc();
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

    it('can fetch an empty market', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      const queue = market.queue as [];
      expect(market.queueType).to.equal(this.constants.queueType.unknown, 'Wrong queue type');
      expect(queue.length).to.equal(0);
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
      // find offsets here: https://docs.nosana.io/programs/jobs.html#accounts-10
      const jobs = await this.jobsProgram.account.jobAccount.all([{ memcmp: { offset: 208, bytes: '2' } }]);

      expect(jobs.length).to.equal(1);

      const job = jobs[0];

      expect(job.account.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.account.status).to.equal(this.constants.jobStatus.running);
    });
  });
}

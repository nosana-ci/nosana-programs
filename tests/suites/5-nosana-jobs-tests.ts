// noinspection JSVoidFunctionReturnValueUsed

import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { buf2hex, getTokenBalance, now, pda } from '../utils';
import { BN } from '@project-serum/anchor';
import _ = require('lodash');

export default function suite() {
  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    expect(await getTokenBalance(this.provider, this.vaults.jobs)).to.equal(this.balances.vaultJob);
  });

  describe('init()', async function () {
    it('can initialize a market with vault', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.market = throwAwayKeypair.publicKey;
      this.accounts.vault = await pda(
        [this.accounts.market.toBuffer(), this.accounts.mint.toBuffer()],
        this.jobsProgram.programId
      );
      this.vaults.jobs = this.accounts.vault;

      await this.jobsProgram.methods
        .init(
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
      expect(market.jobType).to.equal(this.constants.jobType.default);
      expect(market.jobTimeout.toNumber()).to.equal(this.constants.jobTimeout);
      expect(market.jobPrice.toNumber()).to.equal(this.constants.jobPrice);
      expect(market.queueType).to.equal(this.constants.queueType.unknown);
      expect(market.queue.length).to.equal(0);
    });
  });

  describe('create()', async function () {
    it('can create a job when there are no nodes', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.job = throwAwayKeypair.publicKey;

      await this.jobsProgram.methods
        .create(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();
      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can fetch a queued job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.queued);
      expect(job.authority.toString()).to.equal(this.accounts.authority.toString());
      expect(job.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(buf2hex(job.ipfsJob)).to.equal(buf2hex(this.constants.ipfsData));
    });

    it('can fetch a job queue job', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queueType).to.equal(this.constants.queueType.job, 'Wrong queue type');
      expect(market.queue.length).to.equal(1);
      expect(market.queue[0].toString()).to.equal(this.accounts.job.toString());
    });
  });

  describe('enter()', async function () {
    it('can not enter the node queue, when there are jobs to run', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .enter()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobInfoNotFound);
    });

    it('can enter and claim a job from the queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      await this.jobsProgram.methods
        .enter()
        .accounts(this.accounts)
        .remainingAccounts(
          _.map(market.queue, (pubkey) => ({
            isSigner: false,
            isWritable: true,
            pubkey,
          }))
        )
        .rpc();
    });

    it('can not see the job in the queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue.length).to.equal(0);
      expect(market.queueType).to.equal(this.constants.queueType.unknown, 'Wrong queue type');
    });

    it('can see the job running', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.running);
    });

    it('can enter the queue as a node now', async function () {
      await this.jobsProgram.methods.enter().accounts(this.accounts).rpc();
    });

    it('can fetch a node queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queueType).to.equal(this.constants.queueType.node, 'Wrong queue type');
      expect(market.queue.length).to.equal(1);
      expect(market.queue[0].toString()).to.equal(this.accounts.authority.toString());
    });
  });

  describe('create()', async function () {
    it('can create another job', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.job = throwAwayKeypair.publicKey;

      await this.jobsProgram.methods
        .create(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();
      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can fetch a running job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.running);
      expect(job.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.authority.toString()).to.equal(this.accounts.authority.toString());
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

    it('can finish job', async function () {
      await this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc();
      this.balances.user += this.constants.jobPrice;
      this.balances.vaultJob -= this.constants.jobPrice;
    });

    it('can see the node has left the queue', async function () {
      const market = await this.jobsProgram.account.marketAccount.fetch(this.accounts.market);
      expect(market.queue.length).to.equal(0);
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

  describe('claim()', async function () {
    it('can find an unclaimed job', async function () {
      const jobs = await this.jobsProgram.account.jobAccount.all([
        {
          memcmp: {
            offset: this.constants.discriminator + 32 * 3,
            bytes: this.accounts.market.toBase58(),
          },
        },
        {
          memcmp: {
            offset: this.constants.discriminator + 32 * 4,
            bytes: this.accounts.systemProgram.toBase58(),
          },
        },
        {
          memcmp: {
            offset: this.constants.discriminator + 32 * 5 + 8,
            bytes: '1',
          },
        },
      ]);

      expect(jobs.length).to.equal(1);

      const job = jobs[0];

      expect(job.account.node.toString()).to.equal(this.accounts.systemProgram.toString());
      expect(job.account.status).to.equal(this.constants.jobStatus.queued);
      this.accounts.job = job.publicKey;
    });

    it('can claim a job', async function () {
      await this.jobsProgram.methods.claim().accounts(this.accounts).rpc();
    });

    it('can fetch a claimed job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.status).to.equal(this.constants.jobStatus.running);
    });

    it('can find a running job', async function () {
      const jobs = await this.jobsProgram.account.jobAccount.all([
        {
          memcmp: {
            offset: this.constants.discriminator + 32 * 3,
            bytes: this.accounts.market.toBase58(),
          },
        },
        {
          memcmp: {
            offset: this.constants.discriminator + 32 * 5 + 8,
            bytes: '2',
          },
        },
      ]);

      expect(jobs.length).to.equal(1);

      const job = jobs[0];

      expect(job.account.node.toString()).to.equal(this.accounts.authority.toString());
      expect(job.account.status).to.equal(this.constants.jobStatus.running);
    });

    it('can finish job', async function () {
      await this.jobsProgram.methods.finish(this.constants.ipfsData).accounts(this.accounts).rpc();
      this.balances.user += this.constants.jobPrice;
      this.balances.vaultJob -= this.constants.jobPrice;
    });
  });

  describe('close()', async function () {
    it('can close a job', async function () {
      const lamport_before = await this.connection.getBalance(this.accounts.authority);
      await this.jobsProgram.methods.close().accounts(this.accounts).rpc();
      const lamport_after = await this.connection.getBalance(this.accounts.authority);
      expect(lamport_before).to.be.lessThan(lamport_after);
    });

    it('can not fetch a closed Job', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finish(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.SolanaAccountNotInitialized);
    });
  });

  describe('cancel()', async function () {
    it('can enter the queue', async function () {
      await this.jobsProgram.methods.enter().accounts(this.accounts).rpc();
    });

    it('can create a new job and a new project', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.job = throwAwayKeypair.publicKey;

      await this.jobsProgram.methods
        .create(this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();

      this.balances.user -= this.constants.jobPrice;
      this.balances.user -= this.constants.feePrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can not cancel a job from another node', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .cancel()
        .accounts({ ...this.accounts, authority: this.users.user1.publicKey })
        .signers([this.users.user1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can cancel a job', async function () {
      await this.jobsProgram.methods.cancel().accounts(this.accounts).rpc();
    });
  });
}

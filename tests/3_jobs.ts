import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from './utils';
import c from './constants';

export default function suite() {
  describe('init_vault()', async function () {
    it('can initialie the jobs vault', async function () {
      this.accounts.vault = this.ata.vaultJob;
      await this.jobsProgram.methods.initVault().accounts(this.accounts).rpc();
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });
  });

  describe('init_propject()', async function () {
    it('can initilize a project', async function () {
      await this.jobsProgram.methods.initProject().accounts(this.accounts).signers([this.signers.jobs]).rpc();
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('can initialize projects for other users', async function () {
      await Promise.all(
        this.users.users.map(async (u) => {
          await this.jobsProgram.methods
            .initProject()
            .accounts({
              ...this.accounts,
              authority: u.publicKey,
              jobs: u.signers.jobs.publicKey,
            })
            .signers([u.user, u.signers.jobs])
            .rpc();
        })
      );
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('stores projects', async function () {
      const data = await this.jobsProgram.account.jobs.fetch(this.accounts.jobs);
      expect(data.authority.toString()).to.equal(this.accounts.authority.toString());
      expect(data.jobs.length).to.equal(0);
    });
  });

  describe('create_job()', async function () {
    it('Create job', async function () {
      await this.jobsProgram.methods
        .createJob(new anchor.BN(c.jobPrice), this.ipfsData)
        .accounts(this.accounts)
        .signers([this.signers.job])
        .rpc();
      this.balances.user -= c.jobPrice;
      this.balances.vaultJob += c.jobPrice;
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('can not create job in different this.ata', async function () {
      let msg = '';
      const tempJob = anchor.web3.Keypair.generate();
      await this.jobsProgram.methods
        .createJob(new anchor.BN(c.jobPrice), this.ipfsData)
        .accounts({
          ...this.accounts,
          vault: this.accounts.user,
          job: tempJob.publicKey,
        })
        .signers([tempJob])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal('A seeds constraint was violated');
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Create job for other users', async function () {
      await Promise.all(
        this.users.users.map(async (u) => {
          await this.jobsProgram.methods
            .createJob(new anchor.BN(c.jobPrice), this.ipfsData)
            .accounts({
              ...this.accounts,
              jobs: u.signers.jobs.publicKey,
              job: u.signers.job.publicKey,
              user: u.ata,
              authority: u.publicKey,
            })
            .signers([u.user, u.signers.job])
            .rpc();
          // update this.balances
          this.balances.vaultJob += c.jobPrice;
          u.balance -= c.jobPrice;
        })
      );
      await Promise.all(
        this.users.users.map(async (u) => {
          expect(await utils.getTokenBalance(this.provider, u.ata)).to.equal(u.balance);
        })
      );
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    /*
    // create
    it('Create max jobs', async function () {
    for (let i = 0; i < 10; i++) {
    console.log(i);
    let job = anchor.web3.Keypair.generate();
    await program.rpc.createJob(
    bump,
    new anchor.BN(c.jobPrice),
    this.ipfsData,
    {
    accounts: {
    ...accounts,
    job: job.publicKey,
    }, signers: [job]});
    this.balances.user -= c.jobPrice
    this.balances.vault += c.jobPrice
    }

    // tests
    await utils.assertBalancesJobs(this.provider, this.ata, this.balances)
    });
    */

    it('Fetch job', async function () {
      const data = await this.jobsProgram.account.job.fetch(this.accounts.job);
      expect(data.jobStatus).to.equal(c.jobStatus.created);
      expect(utils.buf2hex(new Uint8Array(data.ipfsJob))).to.equal(utils.buf2hex(new Uint8Array(this.ipfsData)));
    });
  });

  describe('claim_job()', async function () {
    it('Claim job', async function () {
      await this.jobsProgram.methods.claimJob().accounts(this.accounts).rpc();
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Claim job that is already claimed', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .claimJob()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.JobNotInitialized);
    });

    it('Claim job for all other nodes and users', async function () {
      this.global.claimTime = new Date();
      await Promise.all(
        [...Array(10).keys()].map(async (i) => {
          let user = this.users.users[i];
          let node = this.users.nodes[i];

          // store these temporary to get them easier later
          node.job = user.signers.job.publicKey;
          node.jobs = user.signers.jobs.publicKey;

          let msg = '';
          await this.jobsProgram.methods
            .claimJob()
            .accounts({
              ...this.accounts,
              authority: node.publicKey,
              stake: node.stake,
              job: node.job,
              jobs: node.jobs,
              nft: node.ataNft,
            })
            .signers([node.user])
            .rpc()
            .catch((e) => (msg = e.error.errorMessage));

          if (i === 0) expect(msg).to.equal(c.errors.NodeUnqualifiedStakeAmount);
          else if (i === 1) expect(msg).to.equal(c.errors.NodeUnqualifiedUnstaked);
          else expect(msg).to.equal('');
        })
      );
    });

    it('Fetch claimed job', async function () {
      const data = await this.jobsProgram.account.job.fetch(this.accounts.job);
      expect(this.global.claimTime / 1e3).to.be.closeTo(data.timeStart.toNumber(), c.allowedClockDelta, 'times differ too much');
      expect(data.jobStatus).to.equal(c.jobStatus.claimed);
      expect(data.node.toString()).to.equal(this.provider.wallet.publicKey.toString());
      expect(data.tokens.toString()).to.equal(c.jobPrice.toString());
    });
  });

  describe('reclaim_job()', async function () {
    it('Reclaim job too soon', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .reclaimJob()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.JobNotTimedOut);
    });
  });

  describe('finish_job()', async function () {
    it('Finish job from other node', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finishJob(this.ipfsData)
        .accounts({
          ...this.accounts,
          authority: this.users.user2.publicKey,
        })
        .signers([this.users.user2.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Finish job', async function () {
      await this.jobsProgram.methods.finishJob(this.ipfsData).accounts(this.accounts).rpc();
      this.balances.user += c.jobPrice;
      this.balances.vaultJob -= c.jobPrice;
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Finish job that is already finished', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finishJob(this.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.JobNotClaimed);
    });

    it('Finish job for all nodes', async function () {
      await Promise.all(
        this.users.otherNodes.map(async (n) => {
          await this.jobsProgram.methods
            .finishJob(this.ipfsData)
            .accounts({
              ...this.accounts,
              job: n.job,
              user: n.ata,
              authority: n.publicKey,
            })
            .signers([n.user])
            .rpc();
          // update this.balances
          this.balances.vaultJob -= c.jobPrice;
          n.balance += c.jobPrice;
          expect(await utils.getTokenBalance(this.provider, n.ata)).to.equal(n.balance);
        })
      );
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Fetch finished job', async function () {
      const dataJobs = await this.jobsProgram.account.jobs.fetch(this.accounts.jobs);
      const dataJob = await this.jobsProgram.account.job.fetch(this.accounts.job);

      expect(this.global.claimTime / 1e3).to.be.closeTo(dataJob.timeEnd.toNumber(), c.allowedClockDelta);
      expect(dataJob.jobStatus).to.equal(c.jobStatus.finished, 'job status does not match');
      expect(dataJobs.jobs.length).to.equal(0, 'number of jobs do not match');
      expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(this.ipfsData)));

      await Promise.all(
        this.users.otherNodes.map(async (n) => {
          const dataJobs = await this.jobsProgram.account.jobs.fetch(n.jobs);
          const dataJob = await this.jobsProgram.account.job.fetch(n.job);

          expect(dataJob.jobStatus).to.equal(c.jobStatus.finished);
          expect(dataJobs.jobs.length).to.equal(0);
          expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(this.ipfsData)));
        })
      );
    });
  });

  describe('close_job()', async function () {
    it('Close job', async function () {
      const lamport_before = await this.connection.getBalance(this.accounts.authority);
      await this.jobsProgram.methods.closeJob().accounts(this.accounts).rpc();
      const lamport_after = await this.connection.getBalance(this.accounts.authority);
      expect(lamport_before).to.be.lessThan(lamport_after);
    });

    it('Fetch closed Job', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finishJob(this.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.SolanaAccountNotInitialized);
    });
  });

  describe('cancel_job()', async function () {
    it('Create new job and new project', async function () {
      this.accounts.job = this.cancelJob.publicKey;

      await this.jobsProgram.methods
        .createJob(new anchor.BN(c.jobPrice), this.ipfsData)
        .accounts(this.accounts)
        .signers([this.cancelJob])
        .rpc();

      await this.jobsProgram.methods
        .initProject()
        .accounts({ ...this.accounts, jobs: this.cancelJobs.publicKey })
        .signers([this.cancelJobs])
        .rpc();

      this.balances.user -= c.jobPrice;
      this.balances.vaultJob += c.jobPrice;
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Cancel job in wrong queue', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .cancelJob()
        .accounts({ ...this.accounts, jobs: this.cancelJobs.publicKey })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.JobQueueNotFound);
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Cancel job from other user', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .cancelJob()
        .accounts({ ...this.accounts, authority: this.users.user1.publicKey })
        .signers([this.users.user1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.Unauthorized);
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Cancel job', async function () {
      await this.jobsProgram.methods.cancelJob().accounts(this.accounts).rpc();
      this.balances.user += c.jobPrice;
      this.balances.vaultJob -= c.jobPrice;
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });

    it('Cancel job in wrong state', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .cancelJob()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(c.errors.JobNotInitialized);
      await utils.assertBalancesJobs(this.provider, this.ata, this.balances);
    });
  });
}

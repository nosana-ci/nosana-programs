import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import { buf2hex, getTokenBalance } from '../utils';

export default function suite() {
  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user);
    expect(await getTokenBalance(this.provider, this.vaults.jobs)).to.equal(this.balances.vaultJob);
  });

  describe('init()', async function () {
    it('can initialize the jobs vault', async function () {
      this.accounts.vault = this.vaults.jobs;
      await this.jobsProgram.methods.init().accounts(this.accounts).rpc();
    });
  });

  describe('start_project()', async function () {
    it('can start a project', async function () {
      await this.jobsProgram.methods.start().accounts(this.accounts).rpc();
    });

    it('can start projects for other users', async function () {
      for (const user of this.users.users) {
        await this.jobsProgram.methods
          .start()
          .accounts({
            systemProgram: this.accounts.systemProgram,
            authority: user.publicKey,
            project: user.project,
          })
          .signers([user.user])
          .rpc();
      }
    });

    it('can fetch a project', async function () {
      const data = await this.jobsProgram.account.projectAccount.fetch(this.accounts.project);
      expect(data.authority.toString()).to.equal(this.accounts.authority.toString());
      expect(data.jobs.length).to.equal(0);
    });
  });

  describe('create()', async function () {
    it('can create a job', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.job = throwAwayKeypair.publicKey;

      await this.jobsProgram.methods
        .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();
      this.balances.user -= this.constants.jobPrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can not create a job in different vault', async function () {
      let msg = '';
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      await this.jobsProgram.methods
        .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
        .accounts({
          ...this.accounts,
          vault: this.accounts.user,
          job: throwAwayKeypair.publicKey,
        })
        .signers([throwAwayKeypair])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal('A seeds constraint was violated');
    });

    it('can create jobs for other users', async function () {
      for (const user of this.users.users) {
        const throwAwayKeypair = anchor.web3.Keypair.generate();
        user.job = throwAwayKeypair.publicKey;
        await this.jobsProgram.methods
          .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
          .accounts({
            ...this.accounts,
            project: user.project,
            job: user.job,
            user: user.ata,
            authority: user.publicKey,
          })
          .signers([user.user, throwAwayKeypair])
          .rpc();
        // update this.balances
        this.balances.vaultJob += this.constants.jobPrice;
        user.balance -= this.constants.jobPrice;
        expect(await getTokenBalance(this.provider, user.ata)).to.equal(user.balance);
      }
    });

    it('can fetch a job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(job.jobStatus).to.equal(this.constants.jobStatus.created);
      expect(buf2hex(new Uint8Array(job.ipfsJob))).to.equal(buf2hex(new Uint8Array(this.constants.ipfsData)));
    });
  });

  describe('claim()', async function () {
    it('can claim a job', async function () {
      await this.jobsProgram.methods.claim().accounts(this.accounts).rpc();
    });

    it('can not claim a job that is already claimed', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .claim()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobNotInitialized);
    });

    it('can claim jobs for all other nodes and users', async function () {
      for (const i of Array(10)) {
        const user = this.users.users[i];
        const node = this.users.nodes[i];

        // store job and project on the nodes for later
        node.project = user.project;
        node.job = user.job;

        let msg = '';
        await this.jobsProgram.methods
          .claim()
          .accounts({
            ...this.accounts,
            authority: node.publicKey,
            stake: node.stake,
            nft: node.ataNft,
            metadata: node.metadata,
            job: node.job,
            project: node.project,
          })
          .signers([node.user])
          .rpc()
          .catch((e) => (msg = e.error.errorMessage));

        if (i === 0) expect(msg).to.equal(this.constants.errors.NodeUnqualifiedStakeAmount);
        else if (i === 1) expect(msg).to.equal(this.constants.errors.NodeUnqualifiedUnstaked);
        else expect(msg).to.equal('');
      }
    });

    it('can fetch a claimed job', async function () {
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);
      expect(Date.now() / 1e3).to.be.closeTo(job.timeStart.toNumber(), this.constants.allowedClockDelta, 'time');
      expect(job.jobStatus).to.equal(this.constants.jobStatus.claimed);
      expect(job.node.toString()).to.equal(this.provider.wallet.publicKey.toString());
      expect(job.tokens.toString()).to.equal(this.constants.jobPrice.toString());
    });
  });

  describe('reclaim()', async function () {
    it('can reclaim job too soon', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .reclaim()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobNotTimedOut);
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

    it('can not finish job that is already finished', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .finish(this.constants.ipfsData)
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobNotClaimed);
    });

    it('can finish job for all nodes', async function () {
      console.log('hello');
      console.log('hello');
      for (const node of this.users.otherNodes) {
        console.log(node.publicKey.toString());
        console.log(node.job.toString());

        await this.jobsProgram.methods
          .finish(this.constants.ipfsData)
          .accounts({
            ...this.accounts,
            job: node.job,
            user: node.ata,
            authority: node.publicKey,
          })
          .signers([node.user])
          .rpc();
        // update balances
        this.balances.vaultJob -= this.constants.jobPrice;
        node.balance += this.constants.jobPrice;
        expect(await getTokenBalance(this.provider, node.ata)).to.equal(node.balance);
      }
    });

    it('can fetch a finished job', async function () {
      const project = await this.jobsProgram.account.projectAccount.fetch(this.accounts.project);
      const job = await this.jobsProgram.account.jobAccount.fetch(this.accounts.job);

      // test job and project
      expect(Date.now() / 1e3).to.be.closeTo(job.timeEnd.toNumber(), this.constants.allowedClockDelta);
      expect(job.jobStatus).to.equal(this.constants.jobStatus.finished, 'job status does not match');
      expect(project.jobs.length).to.equal(0, 'number of jobs do not match');
      expect(buf2hex(new Uint8Array(job.ipfsResult))).to.equal(buf2hex(new Uint8Array(this.constants.ipfsData)));

      for (const node of this.users.otherNodes) {
        const project = await this.jobsProgram.account.projectAccount.fetch(node.project);
        const job = await this.jobsProgram.account.jobAccount.fetch(node.job);

        expect(job.jobStatus).to.equal(this.constants.jobStatus.finished);
        expect(project.jobs.length).to.equal(0);
        expect(buf2hex(new Uint8Array(job.ipfsResult))).to.equal(buf2hex(new Uint8Array(this.constants.ipfsData)));
      }
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
    it('can create a new job and a new project', async function () {
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.job = throwAwayKeypair.publicKey;

      await this.jobsProgram.methods
        .create(new anchor.BN(this.constants.jobPrice), this.constants.ipfsData)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();

      this.balances.user -= this.constants.jobPrice;
      this.balances.vaultJob += this.constants.jobPrice;
    });

    it('can not cancel a job from another user', async function () {
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
      this.balances.user += this.constants.jobPrice;
      this.balances.vaultJob -= this.constants.jobPrice;
    });

    it('can not cancel a job in wrong state', async function () {
      let msg = '';
      await this.jobsProgram.methods
        .cancel()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.JobNotInitialized);
    });
  });
}

import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from '../utils';

export default function suite() {
  describe('init_vault()', async function () {
    it('can initialie the jobs vault', async function () {
      global.accounts.vault = global.ata.vaultJob;
      await global.jobsProgram.methods.init().accounts(global.accounts).rpc();
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });
  });

  describe('init_propject()', async function () {
    it('can initilize a project', async function () {
      await global.jobsProgram.methods.enter().accounts(global.accounts).signers([global.signers.jobs]).rpc();
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('can initialize projects for other users', async function () {
      await Promise.all(
        global.users.users.map(async (u) => {
          await global.jobsProgram.methods
            .enter()
            .accounts({
              ...global.accounts,
              authority: u.publicKey,
              jobs: u.signers.jobs.publicKey,
            })
            .signers([u.user, u.signers.jobs])
            .rpc();
        })
      );
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('stores projects', async function () {
      const data = await global.jobsProgram.account.projectAccount.fetch(global.accounts.jobs);
      expect(data.authority.toString()).to.equal(global.accounts.authority.toString());
      expect(data.jobs.length).to.equal(0);
    });
  });

  describe('create_job()', async function () {
    it('Create job', async function () {
      await global.jobsProgram.methods
        .create(new anchor.BN(global.constants.jobPrice), global.ipfsData)
        .accounts(global.accounts)
        .signers([global.signers.job])
        .rpc();
      global.balances.user -= global.constants.jobPrice;
      global.balances.vaultJob += global.constants.jobPrice;
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('can not create job in different global.ata', async function () {
      let msg = '';
      const tempJob = anchor.web3.Keypair.generate();
      await global.jobsProgram.methods
        .create(new anchor.BN(global.constants.jobPrice), global.ipfsData)
        .accounts({
          ...global.accounts,
          vault: global.accounts.user,
          job: tempJob.publicKey,
        })
        .signers([tempJob])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal('A seeds constraint was violated');
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Create job for other users', async function () {
      await Promise.all(
        global.users.users.map(async (u) => {
          await global.jobsProgram.methods
            .create(new anchor.BN(global.constants.jobPrice), global.ipfsData)
            .accounts({
              ...global.accounts,
              jobs: u.signers.jobs.publicKey,
              job: u.signers.job.publicKey,
              user: u.ata,
              authority: u.publicKey,
            })
            .signers([u.user, u.signers.job])
            .rpc();
          // update global.balances
          global.balances.vaultJob += global.constants.jobPrice;
          u.balance -= global.constants.jobPrice;
        })
      );
      await Promise.all(
        global.users.users.map(async (u) => {
          expect(await utils.getTokenBalance(global.provider, u.ata)).to.equal(u.balance);
        })
      );
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    /*
    // create
    it('Create max jobs', async function () {
    for (let i = 0; i < 10; i++) {
    console.log(i);
    let job = anchor.web3.Keypair.generate();
    await program.rpglobal.constants.create(
    bump,
    new anchor.BN(global.constants.jobPrice),
    global.ipfsData,
    {
    accounts: {
    ...accounts,
    job: job.publicKey,
    }, signers: [job]});
    global.balances.user -= global.constants.jobPrice
    global.balances.vault += global.constants.jobPrice
    }

    // tests
    await utils.assertBalancesJobs(global.provider, global.ata, global.balances)
    });
    */

    it('Fetch job', async function () {
      const data = await global.jobsProgram.account.jobAccount.fetch(global.accounts.job);
      expect(data.jobStatus).to.equal(global.constants.jobStatus.created);
      expect(utils.buf2hex(new Uint8Array(data.ipfsJob))).to.equal(utils.buf2hex(new Uint8Array(global.ipfsData)));
    });
  });

  describe('claim_job()', async function () {
    it('Claim job', async function () {
      await global.jobsProgram.methods.claim().accounts(global.accounts).rpc();
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Claim job that is already claimed', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .claim()
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.JobNotInitialized);
    });

    it('Claim job for all other nodes and users', async function () {
      global.global.claimTime = new Date();
      await Promise.all(
        [...Array(10).keys()].map(async (i) => {
          let user = global.users.users[i];
          let node = global.users.nodes[i];

          // store these temporary to get them easier later
          node.job = user.signers.job.publicKey;
          node.jobs = user.signers.jobs.publicKey;

          let msg = '';
          await global.jobsProgram.methods
            .claim()
            .accounts({
              ...global.accounts,
              authority: node.publicKey,
              stake: node.stake,
              job: node.job,
              jobs: node.jobs,
              nft: node.ataNft,
            })
            .signers([node.user])
            .rpc()
            .catch((e) => (msg = e.error.errorMessage));

          if (i === 0) expect(msg).to.equal(global.constants.errors.NodeUnqualifiedStakeAmount);
          else if (i === 1) expect(msg).to.equal(global.constants.errors.NodeUnqualifiedUnstaked);
          else expect(msg).to.equal('');
        })
      );
    });

    it('Fetch claimed job', async function () {
      const data = await global.jobsProgram.account.jobAccount.fetch(global.accounts.job);
      expect(global.global.claimTime / 1e3).to.be.closeTo(
        data.timeStart.toNumber(),
        global.constants.allowedClockDelta,
        'times differ too much'
      );
      expect(data.jobStatus).to.equal(global.constants.jobStatus.claimed);
      expect(data.node.toString()).to.equal(global.provider.wallet.publicKey.toString());
      expect(data.tokens.toString()).to.equal(global.constants.jobPrice.toString());
    });
  });

  describe('reclaim_job()', async function () {
    it('Reclaim job too soon', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .reclaim()
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.JobNotTimedOut);
    });
  });

  describe('finish_job()', async function () {
    it('Finish job from other node', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .finish(global.ipfsData)
        .accounts({
          ...global.accounts,
          authority: global.users.user2.publicKey,
        })
        .signers([global.users.user2.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.Unauthorized);
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Finish job', async function () {
      await global.jobsProgram.methods.finish(global.ipfsData).accounts(global.accounts).rpc();
      global.balances.user += global.constants.jobPrice;
      global.balances.vaultJob -= global.constants.jobPrice;
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Finish job that is already finished', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .finish(global.ipfsData)
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.JobNotClaimed);
    });

    it('Finish job for all nodes', async function () {
      await Promise.all(
        global.users.otherNodes.map(async (n) => {
          await global.jobsProgram.methods
            .finish(global.ipfsData)
            .accounts({
              ...global.accounts,
              job: n.job,
              user: n.ata,
              authority: n.publicKey,
            })
            .signers([n.user])
            .rpc();
          // update global.balances
          global.balances.vaultJob -= global.constants.jobPrice;
          n.balance += global.constants.jobPrice;
          expect(await utils.getTokenBalance(global.provider, n.ata)).to.equal(n.balance);
        })
      );
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Fetch finished job', async function () {
      const dataJobs = await global.jobsProgram.account.projectAccount.fetch(global.accounts.jobs);
      const dataJob = await global.jobsProgram.account.jobAccount.fetch(global.accounts.job);

      expect(global.global.claimTime / 1e3).to.be.closeTo(
        dataJob.timeEnd.toNumber(),
        global.constants.allowedClockDelta
      );
      expect(dataJob.jobStatus).to.equal(global.constants.jobStatus.finished, 'job status does not match');
      expect(dataJobs.jobs.length).to.equal(0, 'number of jobs do not match');
      expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(
        utils.buf2hex(new Uint8Array(global.ipfsData))
      );

      await Promise.all(
        global.users.otherNodes.map(async (n) => {
          const dataJobs = await global.jobsProgram.account.projectAccount.fetch(n.jobs);
          const dataJob = await global.jobsProgram.account.jobAccount.fetch(n.job);

          expect(dataJob.jobStatus).to.equal(global.constants.jobStatus.finished);
          expect(dataJobs.jobs.length).to.equal(0);
          expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(
            utils.buf2hex(new Uint8Array(global.ipfsData))
          );
        })
      );
    });
  });

  describe('close_job()', async function () {
    it('Close job', async function () {
      const lamport_before = await global.connection.getBalance(global.accounts.authority);
      await global.jobsProgram.methods.close().accounts(global.accounts).rpc();
      const lamport_after = await global.connection.getBalance(global.accounts.authority);
      expect(lamport_before).to.be.lessThan(lamport_after);
    });

    it('Fetch closed Job', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .finish(global.ipfsData)
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.SolanaAccountNotInitialized);
    });
  });

  describe('cancel_job()', async function () {
    it('Create new job and new project', async function () {
      global.accounts.job = global.cancelJob.publicKey;

      await global.jobsProgram.methods
        .create(new anchor.BN(global.constants.jobPrice), global.ipfsData)
        .accounts(global.accounts)
        .signers([global.cancelJob])
        .rpc();

      await global.jobsProgram.methods
        .enter()
        .accounts({ ...global.accounts, jobs: global.cancelJobs.publicKey })
        .signers([global.cancelJobs])
        .rpc();

      global.balances.user -= global.constants.jobPrice;
      global.balances.vaultJob += global.constants.jobPrice;
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Cancel job in wrong queue', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .cancel()
        .accounts({ ...global.accounts, jobs: global.cancelJobs.publicKey })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.JobQueueNotFound);
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Cancel job from other user', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .cancel()
        .accounts({ ...global.accounts, authority: global.users.user1.publicKey })
        .signers([global.users.user1.user])
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.Unauthorized);
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Cancel job', async function () {
      await global.jobsProgram.methods.cancel().accounts(global.accounts).rpc();
      global.balances.user += global.constants.jobPrice;
      global.balances.vaultJob -= global.constants.jobPrice;
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });

    it('Cancel job in wrong state', async function () {
      let msg = '';
      await global.jobsProgram.methods
        .cancel()
        .accounts(global.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(global.constants.errors.JobNotInitialized);
      await utils.assertBalancesJobs(global.provider, global.ata, global.balances);
    });
  });
}

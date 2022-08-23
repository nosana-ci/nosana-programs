  // /*
  //   NOSANA JOBS SECTION
  //  */
  // describe('Nosana Jobs Instructions:', () => {
  //   describe('init_vault()', async () => {
  //     it('Initialize the jobs vault', async () => {
  //       accounts.vault = ata.vaultJob;
  //       await jobsProgram.methods.initVault().accounts(accounts).rpc();
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });
  //   });

  //   describe('init_propject()', async () => {
  //     it('Initialize project', async () => {
  //       await jobsProgram.methods.initProject().accounts(accounts).signers([signers.jobs]).rpc();
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Initialize project for other users', async () => {
  //       await Promise.all(
  //         users.map(async (u) => {
  //           await jobsProgram.methods
  //             .initProject()
  //             .accounts({
  //               ...accounts,
  //               authority: u.publicKey,
  //               jobs: u.signers.jobs.publicKey,
  //             })
  //             .signers([u.user, u.signers.jobs])
  //             .rpc();
  //         })
  //       );
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Fetch project', async () => {
  //       const data = await jobsProgram.account.jobs.fetch(accounts.jobs);
  //       expect(data.authority.toString()).to.equal(accounts.authority.toString());
  //       expect(data.jobs.length).to.equal(0);
  //     });
  //   });

  //   describe('create_job()', async () => {
  //     it('Create job', async () => {
  //       await jobsProgram.methods
  //         .createJob(new anchor.BN(jobPrice), ipfsData)
  //         .accounts(accounts)
  //         .signers([signers.job])
  //         .rpc();
  //       balances.user -= jobPrice;
  //       balances.vaultJob += jobPrice;
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Create job in different ata', async () => {
  //       let msg = '';
  //       const tempJob = anchor.web3.Keypair.generate();
  //       await jobsProgram.methods
  //         .createJob(new anchor.BN(jobPrice), ipfsData)
  //         .accounts({
  //           ...accounts,
  //           vault: accounts.user,
  //           job: tempJob.publicKey,
  //         })
  //         .signers([tempJob])
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal('A seeds constraint was violated');
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Create job for other users', async () => {
  //       await Promise.all(
  //         users.map(async (u) => {
  //           await jobsProgram.methods
  //             .createJob(new anchor.BN(jobPrice), ipfsData)
  //             .accounts({
  //               ...accounts,
  //               jobs: u.signers.jobs.publicKey,
  //               job: u.signers.job.publicKey,
  //               user: u.ata,
  //               authority: u.publicKey,
  //             })
  //             .signers([u.user, u.signers.job])
  //             .rpc();
  //           // update balances
  //           balances.vaultJob += jobPrice;
  //           u.balance -= jobPrice;
  //         })
  //       );
  //       await Promise.all(
  //         users.map(async (u) => {
  //           expect(await utils.getTokenBalance(provider, u.ata)).to.equal(u.balance);
  //         })
  //       );
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     /*
  //     // create
  //     it('Create max jobs', async () => {
  //       for (let i = 0; i < 10; i++) {
  //         console.log(i);
  //         let job = anchor.web3.Keypair.generate();
  //         await program.rpc.createJob(
  //           bump,
  //           new anchor.BN(jobPrice),
  //           ipfsData,
  //           {
  //             accounts: {
  //               ...accounts,
  //               job: job.publicKey,
  //             }, signers: [job]});
  //         balances.user -= jobPrice
  //         balances.vault += jobPrice
  //       }

  //       // tests
  //       await utils.assertBalancesJobs(provider, ata, balances)
  //     });
  //     */

  //     it('Fetch job', async () => {
  //       const data = await jobsProgram.account.job.fetch(accounts.job);
  //       expect(data.jobStatus).to.equal(jobStatus.created);
  //       expect(utils.buf2hex(new Uint8Array(data.ipfsJob))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));
  //     });
  //   });

  //   describe('claim_job()', async () => {
  //     it('Claim job', async () => {
  //       await jobsProgram.methods.claimJob().accounts(accounts).rpc();
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Claim job that is already claimed', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .claimJob()
  //         .accounts(accounts)
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.JobNotInitialized);
  //     });

  //     it('Claim job for all other nodes and users', async () => {
  //       claimTime = new Date();
  //       await Promise.all(
  //         [...Array(10).keys()].map(async (i) => {
  //           let user = users[i];
  //           let node = nodes[i];

  //           // store these temporary to get them easier later
  //           node.job = user.signers.job.publicKey;
  //           node.jobs = user.signers.jobs.publicKey;

  //           let msg = '';
  //           await jobsProgram.methods
  //             .claimJob()
  //             .accounts({
  //               ...accounts,
  //               authority: node.publicKey,
  //               stake: node.stake,
  //               job: node.job,
  //               jobs: node.jobs,
  //               nft: node.ataNft,
  //             })
  //             .signers([node.user])
  //             .rpc()
  //             .catch((e) => (msg = e.error.errorMessage));

  //           if (i === 0) expect(msg).to.equal(errors.NodeUnqualifiedStakeAmount);
  //           else if (i === 1) expect(msg).to.equal(errors.NodeUnqualifiedUnstaked);
  //           else expect(msg).to.equal('');
  //         })
  //       );
  //     });

  //     it('Fetch claimed job', async () => {
  //       const data = await jobsProgram.account.job.fetch(accounts.job);
  //       expect(claimTime / 1e3).to.be.closeTo(data.timeStart.toNumber(), allowedClockDelta, 'times differ too much');
  //       expect(data.jobStatus).to.equal(jobStatus.claimed);
  //       expect(data.node.toString()).to.equal(provider.wallet.publicKey.toString());
  //       expect(data.tokens.toString()).to.equal(jobPrice.toString());
  //     });
  //   });

  //   describe('reclaim_job()', async () => {
  //     it('Reclaim job too soon', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .reclaimJob()
  //         .accounts(accounts)
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.JobNotTimedOut);
  //     });
  //   });

  //   describe('finish_job()', async () => {
  //     it('Finish job from other node', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .finishJob(ipfsData)
  //         .accounts({
  //           ...accounts,
  //           authority: user2.publicKey,
  //         })
  //         .signers([user2.user])
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.Unauthorized);
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Finish job', async () => {
  //       await jobsProgram.methods.finishJob(ipfsData).accounts(accounts).rpc();
  //       balances.user += jobPrice;
  //       balances.vaultJob -= jobPrice;
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Finish job that is already finished', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .finishJob(ipfsData)
  //         .accounts(accounts)
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.JobNotClaimed);
  //     });

  //     it('Finish job for all nodes', async () => {
  //       await Promise.all(
  //         otherNodes.map(async (n) => {
  //           await jobsProgram.methods
  //             .finishJob(ipfsData)
  //             .accounts({
  //               ...accounts,
  //               job: n.job,
  //               user: n.ata,
  //               authority: n.publicKey,
  //             })
  //             .signers([n.user])
  //             .rpc();
  //           // update balances
  //           balances.vaultJob -= jobPrice;
  //           n.balance += jobPrice;
  //           expect(await utils.getTokenBalance(provider, n.ata)).to.equal(n.balance);
  //         })
  //       );
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Fetch finished job', async () => {
  //       const dataJobs = await jobsProgram.account.jobs.fetch(accounts.jobs);
  //       const dataJob = await jobsProgram.account.job.fetch(accounts.job);

  //       expect(claimTime / 1e3).to.be.closeTo(dataJob.timeEnd.toNumber(), allowedClockDelta);
  //       expect(dataJob.jobStatus).to.equal(jobStatus.finished, 'job status does not match');
  //       expect(dataJobs.jobs.length).to.equal(0, 'number of jobs do not match');
  //       expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));

  //       await Promise.all(
  //         otherNodes.map(async (n) => {
  //           const dataJobs = await jobsProgram.account.jobs.fetch(n.jobs);
  //           const dataJob = await jobsProgram.account.job.fetch(n.job);

  //           expect(dataJob.jobStatus).to.equal(jobStatus.finished);
  //           expect(dataJobs.jobs.length).to.equal(0);
  //           expect(utils.buf2hex(new Uint8Array(dataJob.ipfsResult))).to.equal(utils.buf2hex(new Uint8Array(ipfsData)));
  //         })
  //       );
  //     });
  //   });

  //   describe('close_job()', async () => {
  //     it('Close job', async () => {
  //       const lamport_before = await connection.getBalance(accounts.authority);
  //       await jobsProgram.methods.closeJob().accounts(accounts).rpc();
  //       const lamport_after = await connection.getBalance(accounts.authority);
  //       expect(lamport_before).to.be.lessThan(lamport_after);
  //     });

  //     it('Fetch closed Job', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .finishJob(ipfsData)
  //         .accounts(accounts)
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.SolanaAccountNotInitialized);
  //     });
  //   });

  //   describe('cancel_job()', async () => {
  //     it('Create new job and new project', async () => {
  //       accounts.job = cancelJob.publicKey;

  //       await jobsProgram.methods
  //         .createJob(new anchor.BN(jobPrice), ipfsData)
  //         .accounts(accounts)
  //         .signers([cancelJob])
  //         .rpc();

  //       await jobsProgram.methods
  //         .initProject()
  //         .accounts({ ...accounts, jobs: cancelJobs.publicKey })
  //         .signers([cancelJobs])
  //         .rpc();

  //       balances.user -= jobPrice;
  //       balances.vaultJob += jobPrice;
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Cancel job in wrong queue', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .cancelJob()
  //         .accounts({ ...accounts, jobs: cancelJobs.publicKey })
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.JobQueueNotFound);
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Cancel job from other user', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .cancelJob()
  //         .accounts({ ...accounts, authority: user1.publicKey })
  //         .signers([user1.user])
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.Unauthorized);
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Cancel job', async () => {
  //       await jobsProgram.methods.cancelJob().accounts(accounts).rpc();
  //       balances.user += jobPrice;
  //       balances.vaultJob -= jobPrice;
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });

  //     it('Cancel job in wrong state', async () => {
  //       let msg = '';
  //       await jobsProgram.methods
  //         .cancelJob()
  //         .accounts(accounts)
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.JobNotInitialized);
  //       await utils.assertBalancesJobs(provider, ata, balances);
  //     });
  //   });
  // });

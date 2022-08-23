  /*
    NOSANA REWARDS SECTION
  */
  // describe('Nosana Rewards Instructions:', () => {
  //   describe('init()', async () => {
  //     it('Initialize the rewards vault', async () => {
  //       accounts.stats = stats.rewards;
  //       accounts.vault = ata.vaultRewards;
  //       await rewardsProgram.methods.init().accounts(accounts).rpc();
  //       const data = await rewardsProgram.account.statsAccount.fetch(accounts.stats);
  //       expect(data.totalXnos.toString()).to.equal(totalXnos.toString());
  //       expect(data.totalReflection.toString()).to.equal(totalReflection.toString());
  //       expect(data.rate.toString()).to.equal(initialRate.toString());
  //       await utils.assertBalancesRewards(provider, ata, balances);
  //     });
  //   });

  //   describe('enter()', async () => {
  //     it('Enter rewards pool with other stake', async () => {
  //       let msg = '';
  //       await rewardsProgram.methods
  //         .enter()
  //         .accounts({ ...accounts, stake: node1.stake })
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.Unauthorized);
  //     });

  //     it('Enter rewards pool with main wallet', async () => {
  //       await rewardsProgram.methods.enter().accounts(accounts).rpc();
  //       await updateRewards(accounts.stake, accounts.stats);
  //     });

  //     it('Can not unstake while reward is open', async () => {
  //       let msg = '';
  //       await stakingProgram.methods
  //         .unstake()
  //         .accounts(accounts)
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.StakeHasReward);
  //     });

  //     it('Enter rewards with the other nodes', async () => {
  //       for (const node of otherNodes) {
  //         await rewardsProgram.methods
  //           .enter()
  //           .accounts({ ...accounts, stake: node.stake, reward: node.reward, authority: node.publicKey })
  //           .signers([node.user])
  //           .rpc();
  //         await updateRewards(node.stake, accounts.stats);
  //       }
  //     });
  //   });

  //   describe('add_fee()', async () => {
  //     it('Add fees to the pool', async () => {
  //       await rewardsProgram.methods.addFee(new anchor.BN(feeAmount)).accounts(accounts).rpc();
  //       await updateRewards(accounts.stake, accounts.stats, new anchor.BN(feeAmount));
  //       balances.user -= feeAmount;
  //       balances.vaultRewards += feeAmount;
  //       await utils.assertBalancesRewards(provider, ata, balances);
  //     });
  //   });

  //   describe('claim()', async () => {
  //     it('Claim rewards', async () => {
  //       const reflection = (await rewardsProgram.account.rewardAccount.fetch(accounts.reward)).reflection;
  //       await rewardsProgram.methods.claim().accounts(accounts).rpc();
  //       const amount = await updateRewards(accounts.stake, accounts.stats, new anchor.BN(0), reflection);
  //       balances.user += amount;
  //       balances.vaultRewards -= amount;
  //       await utils.assertBalancesRewards(provider, ata, balances);
  //     });

  //     it('Claim other rewards', async () => {
  //       for (const node of otherNodes) {
  //         const reflection = (await rewardsProgram.account.rewardAccount.fetch(node.reward)).reflection;
  //         await rewardsProgram.methods
  //           .claim()
  //           .accounts({
  //             ...accounts,
  //             stake: node.stake,
  //             reward: node.reward,
  //             authority: node.publicKey,
  //             user: node.ata,
  //           })
  //           .signers([node.user])
  //           .rpc();
  //         const amount = await updateRewards(node.stake, accounts.stats, new anchor.BN(0), reflection);
  //         node.balance += amount;
  //         balances.vaultRewards -= amount;
  //         await utils.assertBalancesRewards(provider, ata, balances);
  //       }
  //       expect(await utils.getTokenBalance(provider, ata.vaultRewards)).to.be.closeTo(0, 100, 'vault is empty');
  //     });
  //   });

  //   describe('sync()', async () => {
  //     it('Add more fees to the pool', async () => {
  //       await rewardsProgram.methods.addFee(new anchor.BN(feeAmount)).accounts(accounts).rpc();
  //       await updateRewards(accounts.stake, accounts.stats, new anchor.BN(feeAmount));
  //       balances.user -= feeAmount;
  //       balances.vaultRewards += feeAmount;
  //       await utils.assertBalancesRewards(provider, ata, balances);
  //     });

  //     it('Topup stake', async () => {
  //       await stakingProgram.methods
  //         .topup(new anchor.BN(stakeAmount))
  //         .accounts({ ...accounts, vault: ata.userVaultStaking })
  //         .rpc();
  //       balances.user -= stakeAmount;
  //       balances.vaultStaking += stakeAmount;
  //       await utils.assertBalancesStaking(provider, ata, balances);
  //       expect((await stakingProgram.account.stakeAccount.fetch(accounts.stake)).xnos.toNumber()).to.equal(
  //         utils.calculateXnos(stakeDurationMin * 2 + 7, stakeAmount * 2 + stakeMinimum)
  //       );
  //     });

  //     it('Sync reward reflection for wrong accounts', async () => {
  //       let msg = '';
  //       await rewardsProgram.methods
  //         .sync()
  //         .accounts({ ...accounts, reward: nodes[4].reward })
  //         .rpc()
  //         .catch((e) => (msg = e.error.errorMessage));
  //       expect(msg).to.equal(errors.Unauthorized);
  //     });

  //     it('Sync reward reflection', async () => {
  //       const before = await rewardsProgram.account.rewardAccount.fetch(accounts.reward);
  //       await rewardsProgram.methods.sync().accounts(accounts).rpc();
  //       const after = await rewardsProgram.account.rewardAccount.fetch(accounts.reward);
  //       const stake = (await stakingProgram.account.stakeAccount.fetch(accounts.stake)).xnos.toNumber();

  //       expect(before.xnos.toNumber()).to.be.lessThan(after.xnos.toNumber());
  //       expect(after.xnos.toNumber()).to.equal(stake);
  //       expect(after.xnos.toNumber()).to.equal(
  //         utils.calculateXnos(stakeDurationMin * 2 + 7, stakeAmount * 2 + stakeMinimum)
  //       );

  //       totalXnos.iadd(after.xnos.sub(before.xnos));
  //       totalReflection.isub(before.reflection);
  //       const reflection = after.xnos.add(before.reflection.div(new anchor.BN(rate)).sub(before.xnos)).mul(rate);
  //       totalReflection.iadd(reflection);

  //       expect(reflection.toString()).to.equal(after.reflection.toString());

  //       const rewardsAccount = await rewardsProgram.account.statsAccount.fetch(stats.rewards);

  //       expect(rewardsAccount.totalXnos.toString()).to.equal(totalXnos.toString(), 'Total XNOS error');
  //       expect(rewardsAccount.totalReflection.toString()).to.equal(
  //         totalReflection.toString(),
  //         'Total reflection error'
  //       );
  //       expect(rewardsAccount.rate.toString()).to.equal(rate.toString(), 'Rate error');
  //     });

  //     it('Add another round of fees to the pool', async () => {
  //       await rewardsProgram.methods.addFee(new anchor.BN(feeAmount)).accounts(accounts).rpc();
  //       await updateRewards(accounts.stake, accounts.stats, new anchor.BN(feeAmount));
  //       balances.user -= feeAmount;
  //       balances.vaultRewards += feeAmount;
  //       await utils.assertBalancesRewards(provider, ata, balances);
  //     });

  //     it('Sync reward reflection for others', async () => {
  //       for (const node of otherNodes) {
  //         const before = await rewardsProgram.account.rewardAccount.fetch(node.reward);
  //         await rewardsProgram.methods
  //           .sync()
  //           .accounts({ ...accounts, stake: node.stake, reward: node.reward })
  //           .rpc();
  //         const after = await rewardsProgram.account.rewardAccount.fetch(node.reward);
  //         const stake = await stakingProgram.account.stakeAccount.fetch(node.stake);
  //         expect(before.xnos.toNumber()).to.equal(after.xnos.toNumber());
  //         expect(stake.xnos.toNumber()).to.equal(after.xnos.toNumber());
  //       }
  //     });
  //   });

  //   describe('close()', async () => {
  //     it('Close reward account and unstake in the same tx', async () => {
  //       await utils.assertBalancesRewards(provider, ata, balances);

  //       let stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
  //       expect(stake.timeUnstake.toNumber()).to.equal(0);

  //       await stakingProgram.methods
  //         .unstake()
  //         .accounts(accounts)
  //         .preInstructions([await rewardsProgram.methods.close().accounts(accounts).instruction()])
  //         .rpc();

  //       stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
  //       expect(stake.timeUnstake.toNumber()).to.not.equal(0);
  //       await stakingProgram.methods.restake().accounts(accounts).rpc();
  //     });

  //     it('Close other accounts', async () => {
  //       for (const node of otherNodes) {
  //         await rewardsProgram.methods
  //           .close()
  //           .accounts({
  //             ...accounts,
  //             reward: node.reward,
  //             stake: node.stake,
  //             authority: node.publicKey,
  //           })
  //           .signers([node.user])
  //           .rpc();
  //       }
  //     });
  //   });

  //   let alice, bob, carol;
  //   const setupUser = async (amount) => { await utils.setupSolanaUser(connection, mint, stakingProgram.programId, rewardsProgram.programId, amount, provider); };

  //   describe('rewards scenarios', async () => {
  //     before(async () => {
  //       alice = await setupUser(600000000);
  //       console.log('hi');
  //       console.log(alice);
  //     });

  //     beforeEach(async () => {
  //     });

  //     it('works with large quantities', async () => {
  //       console.log(alice.user);
  //       console.log('ho');
  //       console.log(await utils.getTokenBalance(provider, alice.ata));
  //     });
  //   });
  // });

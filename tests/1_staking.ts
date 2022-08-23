import { expect } from 'chai';
import * as utils from './utils';

export default function suite() {
  beforeEach(function () {
    this.accounts.vault = this.ata.userVaultStaking;
  });

  describe('init()', async function () {
    it('can initialize', async function () {
      this.accounts.settings = this.stats.staking;
      await this.stakingProgram.methods.init().accounts(this.accounts).rpc();
      await utils.assertBalancesStaking(this.provider, this.ata, this.balances);
    });
  });

//   describe('stake()', async () => {
//     it('Stake too short', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMin - 1))
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeDurationTooShort);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Stake too long', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMax + 1))
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeDurationTooLong);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Stake too less', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .stake(new anchor.BN(stakeMinimum - 1), new anchor.BN(stakeDurationMax))
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeAmountNotEnough);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Stake minimum', async () => {
//       await stakingProgram.methods
//         .stake(new anchor.BN(stakeMinimum), new anchor.BN(stakeDurationMin))
//         .accounts(accounts)
//         .rpc();

//       // test balances
//       balances.user -= stakeMinimum;
//       balances.vaultStaking += stakeMinimum;
//       await utils.assertBalancesStaking(provider, ata, balances);

//       // test staking account
//       const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       expect(stake.amount.toNumber()).to.equal(stakeMinimum, 'amount');
//       expect(stake.vault.toString()).to.equal(accounts.vault.toString(), 'vault');
//       expect(stake.authority.toString()).to.equal(accounts.authority.toString(), 'authority');
//       expect(stake.duration.toNumber()).to.equal(stakeDurationMin, 'duration');
//       expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(stakeDurationMin, stakeMinimum), 'xnos');
//     });

//     it('Stake maximum', async () => {
//       await stakingProgram.methods
//         .stake(new anchor.BN(stakeAmount), new anchor.BN(stakeDurationMax))
//         .accounts({
//           ...accounts,
//           user: user4.ata,
//           authority: user4.publicKey,
//           stake: user4.stake,
//           vault: user4.vault,
//         })
//         .signers([user4.user])
//         .rpc();
//       user4.balance -= stakeAmount;
//       balances.vaultStaking += stakeAmount;
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Stake for node 1, not enough for jobs', async () => {
//       let amount = minimumNodeStake - 1;
//       await stakingProgram.methods
//         .stake(new anchor.BN(amount), new anchor.BN(stakeDurationMin))
//         .accounts({
//           ...accounts,
//           user: node1.ata,
//           authority: node1.publicKey,
//           stake: node1.stake,
//           vault: node1.vault,
//         })
//         .signers([node1.user])
//         .rpc();
//       node1.balance -= amount;
//       balances.vaultStaking += amount;
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Stake for node 2, and unstake', async () => {
//       await stakingProgram.methods
//         .stake(new anchor.BN(minimumNodeStake), new anchor.BN(stakeDurationMin))
//         .accounts({
//           ...accounts,
//           user: node2.ata,
//           authority: node2.publicKey,
//           stake: node2.stake,
//           vault: node2.vault,
//         })
//         .signers([node2.user])
//         .rpc();
//       await stakingProgram.methods
//         .unstake()
//         .accounts({
//           ...accounts,
//           authority: node2.publicKey,
//           reward: node2.reward,
//           stake: node2.stake,
//         })
//         .signers([node2.user])
//         .rpc();
//       node2.balance -= minimumNodeStake;
//       balances.vaultStaking += minimumNodeStake;
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Stake for other nodes', async () => {
//       await Promise.all(
//         otherNodes.map(async (n) => {
//           await stakingProgram.methods
//             .stake(new anchor.BN(stakeAmount * 2), new anchor.BN(3 * stakeDurationMin))
//             .accounts({
//               ...accounts,
//               user: n.ata,
//               authority: n.publicKey,
//               stake: n.stake,
//               vault: n.vault,
//             })
//             .signers([n.user])
//             .rpc();
//           balances.vaultStaking += stakeAmount * 2;
//           n.balance -= stakeAmount * 2;
//           expect(await utils.getTokenBalance(provider, n.ata)).to.equal(n.balance);
//         })
//       );
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });
//   });

//   describe('extend()', async () => {
//     it('Extend a stake with negative duration', async () => {
//       const accountBefore = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       await stakingProgram.methods.extend(new anchor.BN(-7)).accounts(accounts).rpc();
//       const accountAfter = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       expect(accountAfter.duration.toNumber()).to.equal(accountBefore.duration.toNumber() + 7);
//     });

//     it('Extend a stake too long', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .extend(new anchor.BN(stakeDurationMax))
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeDurationTooLong);
//     });

//     it('Extend a stake', async () => {
//       await stakingProgram.methods.extend(new anchor.BN(stakeDurationMin)).accounts(accounts).rpc();

//       // check stake
//       const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       expect(stake.duration.toNumber()).to.equal(stakeDurationMin * 2 + 7);
//       expect(stake.amount.toNumber()).to.equal(stakeMinimum);
//       expect(stake.xnos.toNumber()).to.equal(utils.calculateXnos(stakeDurationMin * 2 + 7, stakeMinimum), 'xnos');
//     });
//   });

//   describe('unstake()', async () => {
//     it('Unstake from other account', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .unstake()
//         .accounts({ ...accounts, authority: user3.publicKey })
//         .signers([user3.user])
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.Unauthorized);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Can not unstake with invalid reward account', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .unstake()
//         .accounts({
//           ...accounts,
//           reward: anchor.web3.Keypair.generate().publicKey,
//         })
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeDoesNotMatchReward);

//       await stakingProgram.methods
//         .unstake()
//         .accounts({
//           ...accounts,
//           reward: accounts.stake,
//         })
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeHasReward);
//     });

//     it('Can unstake', async () => {
//       await stakingProgram.methods.unstake().accounts(accounts).rpc();
//       const data = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       expect(Date.now() / 1e3).to.be.closeTo(data.timeUnstake.toNumber(), 2);
//       await utils.assertBalancesStaking(provider, ata, balances);

//       // check stake
//       const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       expect(stake.xnos.toNumber()).to.equal(0);
//     });
//   });

//   describe('topup(), restake()', async () => {
//     it('Topup after unstake', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .topup(new anchor.BN(stakeAmount))
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeAlreadyUnstaked);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Restake', async () => {
//       await stakingProgram.methods.restake().accounts(accounts).rpc();
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Topup', async () => {
//       await stakingProgram.methods.topup(new anchor.BN(stakeAmount)).accounts(accounts).rpc();
//       balances.user -= stakeAmount;
//       balances.vaultStaking += stakeAmount;
//       await utils.assertBalancesStaking(provider, ata, balances);

//       // check stake
//       const stake = await stakingProgram.account.stakeAccount.fetch(accounts.stake);
//       expect(stake.duration.toNumber()).to.equal(stakeDurationMin * 2 + 7, 'duration');
//       expect(stake.amount.toNumber()).to.equal(stakeMinimum + stakeAmount, 'amount');
//       expect(stake.xnos.toNumber()).to.equal(
//         utils.calculateXnos(stakeDurationMin * 2 + 7, stakeMinimum + stakeAmount),
//         'xnos'
//       );
//     });
//   });

//   describe('claim()', async () => {
//     it('Claim before unstake', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .claim()
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeNotUnstaked);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Claim after too soon unstake', async () => {
//       await stakingProgram.methods.unstake().accounts(accounts).rpc();
//       let msg = '';
//       await stakingProgram.methods
//         .claim()
//         .accounts(accounts)
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.StakeLocked);
//       await utils.assertBalancesStaking(provider, ata, balances);
//       await stakingProgram.methods.restake().accounts(accounts).rpc();
//     });

//     //
//     //  To run this test you will have to modify claim.rs and change stake.duration to 5 seconds:
//     //
//     //          constraint = stake.time_unstake + i64::try_from(5).unwrap() <
//     //                                                          ^
//     /*
//       it('Claim after unstake duration', async () => {
//       let balanceBefore = await utils.getTokenBalance(provider, node2.ata);
//       await utils.sleep(5000);
//       await stakingProgram.methods
//       .claim()
//       .accounts({
//       ...accounts,
//       user: node2.ata,
//       stake: node2.stake,
//       authority: node2.publicKey,
//       vault: node2.vault,
//       })
//       .signers([node2.user])
//       .rpc();
//       let balanceAfter = await utils.getTokenBalance(provider, node2.ata);
//       expect(balanceAfter).to.equal(balanceBefore + stakeAmount);
//       });
//     */
//   });

//   describe('slash(), update_authority()', async () => {
//     it('Slash', async () => {
//       const stakeBefore = await stakingProgram.account.stakeAccount.fetch(nodes[2].stake);

//       await stakingProgram.methods
//         .slash(new anchor.BN(slashAmount))
//         .accounts({ ...accounts, stake: nodes[2].stake, vault: nodes[2].vault })
//         .rpc();

//       balances.user += slashAmount;
//       balances.vaultStaking -= slashAmount;
//       await utils.assertBalancesStaking(provider, ata, balances);
//       const stakeAfter = await stakingProgram.account.stakeAccount.fetch(nodes[2].stake);
//       expect(stakeAfter.amount.toNumber()).to.equal(stakeBefore.amount.toNumber() - slashAmount);
//     });

//     it('Slash unauthorized', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .slash(new anchor.BN(slashAmount))
//         .accounts({ ...accounts, authority: node1.publicKey })
//         .signers([node1.user])
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.Unauthorized);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Slash unauthorized hack 2', async () => {
//       let msg = '';
//       await stakingProgram.methods
//         .slash(new anchor.BN(slashAmount))
//         .accounts({ ...accounts, settings: accounts.stake })
//         .rpc()
//         .catch((e) => (msg = e.error.errorMessage));
//       expect(msg).to.equal(errors.Solana8ByteConstraint);
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Update slash authority to node 1', async () => {
//       await stakingProgram.methods
//         .updateAuthority()
//         .accounts({ ...accounts, newAuthority: node1.publicKey })
//         .rpc();
//       const stats = await stakingProgram.account.settingsAccount.fetch(accounts.settings);
//       expect(stats.authority.toString()).to.equal(node1.publicKey.toString());
//     });

//     it('Slash with Node 1', async () => {
//       await stakingProgram.methods
//         .slash(new anchor.BN(slashAmount))
//         .accounts({
//           ...accounts,
//           stake: nodes[2].stake,
//           authority: node1.publicKey,
//           vault: nodes[2].vault,
//         })
//         .signers([node1.user])
//         .rpc();

//       balances.user += slashAmount;
//       balances.vaultStaking -= slashAmount;
//       await utils.assertBalancesStaking(provider, ata, balances);
//     });

//     it('Update settings authority back', async () => {
//       await stakingProgram.methods
//         .updateAuthority()
//         .accounts({ ...accounts, authority: node1.publicKey, newAuthority: accounts.authority })
//         .signers([node1.user])
//         .rpc();
//       const stats = await stakingProgram.account.settingsAccount.fetch(accounts.settings);
//       expect(stats.authority.toString()).to.equal(accounts.authority.toString());
//     });
//   });
// });
}

import { BN } from '@project-serum/anchor';
import { getTokenBalance, now, pda } from '../../utils';
import { expect } from 'chai';
import * as anchor from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { afterEach, Context } from 'mocha';
import { transfer } from '@solana/spl-token';

/**
 * Function to add additional funds to the vault from the pool
 * @param mochaContext
 * @param amount
 */
async function fundPool(mochaContext: Context, amount: number) {
  await transfer(
    mochaContext.connection,
    mochaContext.payer,
    mochaContext.accounts.user,
    mochaContext.vaults.pools,
    mochaContext.payer,
    amount
  );
  mochaContext.balances.user -= amount;
  mochaContext.balances.vaultPool += amount;
}

/**
 * Function to fetch the pool account
 * @param mochaContext
 */
async function getPool(mochaContext: Context) {
  return await mochaContext.poolsProgram.account.poolAccount.fetch(mochaContext.accounts.pool);
}

/**
 * MAIN SCENARIO SUITE
 */
export default function suite() {
  describe('open()', async function () {
    afterEach(async function () {
      expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user, 'user');
      expect(await getTokenBalance(this.provider, this.accounts.beneficiary)).to.equal(
        this.balances.beneficiary,
        'beneficiary'
      );
      if (!this.poolClosed)
        expect(await getTokenBalance(this.provider, this.vaults.pools)).to.equal(this.balances.vaultPool, 'vaultPool');
    });

    it('can open a pool', async function () {
      // define pool account
      const throwAwayKeypair = anchor.web3.Keypair.generate();
      this.accounts.pool = throwAwayKeypair.publicKey;
      this.vaults.pools = await pda([utf8.encode('vault'), this.accounts.pool.toBuffer()], this.poolsProgram.programId);
      this.accounts.vault = this.vaults.pools;
      this.accounts.beneficiary = this.users.user1.ata;
      this.balances.beneficiary = await getTokenBalance(this.provider, this.accounts.beneficiary);
      this.poolClosed = false;

      // start pool 3 second ago
      const startTime = now() - 3;

      // open pool
      await this.poolsProgram.methods
        .open(new BN(this.constants.emission), new BN(startTime), this.constants.claimType.transfer, true)
        .accounts(this.accounts)
        .signers([throwAwayKeypair])
        .rpc();

      // test pool
      const pool = await getPool(this);
      expect(pool.emission.toNumber()).to.equal(this.constants.emission);
      expect(pool.startTime.toNumber()).to.equal(startTime);
      expect(pool.claimedTokens.toNumber()).to.equal(0);
      expect(pool.closeable).to.equal(true);
    });
  });

  describe('claim_transfer()', async function () {
    it('can fill pool vault', async function () {
      await fundPool(this, 14);
    });

    it('can not claim underfunded pool', async function () {
      let msg = '';
      await this.poolsProgram.methods
        .claimTransfer()
        .accounts(this.accounts)
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.PoolUnderfunded);
    });

    it('can claim a multiple of emission', async function () {
      await fundPool(this, this.constants.emission * 3);
      const beneficiaryBalanceBefore = await getTokenBalance(this.provider, this.accounts.beneficiary);
      await this.poolsProgram.methods.claimTransfer().accounts(this.accounts).rpc();
      const beneficiaryBalanceAfter = await getTokenBalance(this.provider, this.accounts.beneficiary);

      // determine payout
      const release = beneficiaryBalanceAfter - beneficiaryBalanceBefore;
      expect(release).to.be.above(0);

      // update ledgers
      this.balances.beneficiary += release;
      this.balances.vaultPool -= release;
    });
  });

  describe('update_beneficiary()', async function () {
    it('can not update the beneficiary from another pool', async function () {
      let msg = '';
      await this.poolsProgram.methods
        .updateBeneficiary()
        .accounts({
          ...this.accounts,
          newBeneficiary: this.users.user2.ata,
        })
        .rpc()
        .catch((e) => (msg = e.error.errorMessage));
      expect(msg).to.equal(this.constants.errors.Unauthorized);
    });

    it('can update the beneficiary from own pool', async function () {
      await this.poolsProgram.methods
        .updateBeneficiary()
        .accounts({
          ...this.accounts,
          newBeneficiary: this.users.user2.ata,
        })
        .rpc();
    });
  });
}

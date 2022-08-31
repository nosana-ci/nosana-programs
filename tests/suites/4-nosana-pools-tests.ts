import { getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import { getTokenBalance, sleep } from '../utils';
import { afterEach } from 'mocha';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';

const now = function () {
  return Math.floor(Date.now() / 1e3);
};

export default function suite() {
  before(async function () {
    this.pool = anchor.web3.Keypair.generate();
    [this.poolVault] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('vault'), this.pool.publicKey.toBuffer()],
      this.poolsProgram.programId
    );

    // helper to add funds to the pool
    this.fundPool = async function (amount) {
      await transfer(
        this.connection,
        this.payer,
        await getAssociatedTokenAddress(this.accounts.mint, this.wallet.publicKey),
        this.poolVault,
        this.payer,
        amount
      );
      this.balances.user -= amount;
      this.amount += amount;
    };

    this.getPool = async function () {
      return await this.poolsProgram.account.poolAccount.fetch(this.pool.publicKey);
    };

    this.emission = 20;
    this.amount = 0;
  });

  beforeEach(async function () {
    this.accounts.pool = this.pool.publicKey;
    this.accounts.vault = this.poolVault;
    this.accounts.rewardsProgram = this.rewardsProgram.programId;
    this.accounts.beneficiary = this.ata.vaultRewards;

    this.rewardsBalanceBefore = await getTokenBalance(this.provider, this.vaults.rewards);
  });

  afterEach(async function () {
    expect(await getTokenBalance(this.provider, this.accounts.user)).to.equal(this.balances.user, 'user');
    expect(await getTokenBalance(this.provider, this.poolVault)).to.equal(this.amount);
  });

  it('can open a pool', async function () {
    // start pool 3 second ago
    let startTime = now() - 3;

    await this.poolsProgram.methods
      .open(new BN(this.emission), new BN(startTime), 1, true)
      .accounts(this.accounts)
      .signers([this.pool])
      .rpc();

    const pool = await this.getPool();

    expect(pool.emission.toNumber()).to.equal(this.emission);
    expect(pool.startTime.toNumber()).to.equal(startTime);
    expect(pool.claimedTokens.toNumber()).to.equal(0);
    expect(pool.closeable).to.equal(true);
  });

  it('can fill pool vault', async function () {
    await this.fundPool(14);
  });

  it('can claim underfunded', async function () {
    await this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc();
  });

  it('can claim a multiple of emission', async function () {
    await this.fundPool(this.emission * 3);

    await sleep(5000);

    expect(await getTokenBalance(this.provider, this.poolVault)).to.equal(this.amount, 'vault balance');

    await this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc();
    expect(await getTokenBalance(this.provider, this.poolVault)).to.equal(0);
  });

  it('can claim for full elapsed time', async function () {
    // fund for 5 seconds
    await this.fundPool(this.emission * 5);

    let pool = await this.getPool();

    // sleep at least 1 second
    await sleep(1000);

    let elapsed = now() - pool.startTime;
    expect(elapsed).to.be.above(1);
    await this.poolsProgram.methods.claimFee().accounts(this.accounts).rpc();

    const after = await getTokenBalance(this.provider, this.ata.vaultRewards);
    let claimed = after - this.rewardsBalanceBefore;

    // allow a second of drift
    expect(claimed).to.equal(this.emission * 5);
  });

  it('can close', async function () {
    const amount = await getTokenBalance(this.provider, this.poolVault);
    this.balances.user += amount;
    await this.poolsProgram.methods.close().accounts(this.accounts).rpc();
  });
}

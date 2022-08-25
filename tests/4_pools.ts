import { TOKEN_PROGRAM_ID, createAssociatedTokenAccount, getAssociatedTokenAddress, transfer } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { BN } from '@project-serum/anchor';
import { expect } from 'chai';
import * as utils from './utils';
import c from './constants';

export default function suite() {
  before(async function () {
    this.pool = anchor.web3.Keypair.generate();
    [this.poolVault] = await anchor.web3.PublicKey.findProgramAddress(
      [utils.utf8_encode("vault"), this.pool.publicKey.toBuffer()],
      this.poolsProgram.programId
    );
  });

  beforeEach(async function () {
    this.accounts.pool = this.pool.publicKey;
    this.accounts.vault = this.poolVault;
  });

  it('can open a pool', async function () {
    let emmission = 20;
    let startTime = 121212;

    await this.poolsProgram.methods.open(new BN(emmission), new BN(startTime), true)
      .accounts(this.accounts)
      .signers([this.pool])
      .rpc();

    const pool = await this.poolsProgram.account.poolAccount.fetch(this.pool.publicKey);
    expect(pool.emmission.toNumber()).to.equal(emmission);
    expect(pool.startTime.toNumber()).to.equal(startTime);
    expect(pool.lastClaimTime.toNumber()).to.equal(startTime);
    expect(pool.closeable).to.equal(true);
  });

  it('can fill pool vault', async function () {
    let amount = 14;

    await transfer(this.connection, this.payer,
                   await getAssociatedTokenAddress(this.accounts.mint, this.wallet.publicKey),
                   this.poolVault, this.payer, amount);
  });

  it('can not claim underfunded', async function () {

  });
}

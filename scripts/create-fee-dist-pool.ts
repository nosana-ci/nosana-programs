// @ts-ignore
import { AnchorProvider, Program, setProvider, web3, BN, Idl } from '@anchor-lang/core';
import { utf8 } from '@anchor-lang/core/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { pda } from '../tests/utils';
import poolConfig = require('../tests/data/pool.json');

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // pool config
  const keyPair = Keypair.generate();

  // public keys
  const mint = new PublicKey(poolConfig.mint);
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');

  // program
  const idl = (await Program.fetchIdl(poolsId.toString())) as Idl;
  // @ts-ignore
  const program = new Program(idl, poolsId);

  // PDAs
  const accounts = {
    authority: provider.wallet.publicKey,
    beneficiary: await pda([mint.toBuffer()], rewardsId),
    mint,
    pool: keyPair.publicKey,
    rent: web3.SYSVAR_RENT_PUBKEY,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    vault: await pda([utf8.encode('vault'), keyPair.publicKey.toBuffer()], poolsId),
  };

  // open pool
  const tx = await program.methods
    .open(new BN(poolConfig.emission), new BN(poolConfig.startTime), poolConfig.claimType, poolConfig.closeable)
    .accounts(accounts)
    .signers([keyPair])
    .rpc();
  console.log(`https://explorer.solana.com/tx/${tx}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

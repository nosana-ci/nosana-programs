// @ts-ignore
import { AnchorProvider, Program, setProvider, Idl } from '@anchor-lang/core';
import { utf8 } from '@anchor-lang/core/dist/cjs/utils/bytes';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { pda } from '../tests/utils';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // CHANGE: the ID of the pool to claim from
  const pool = new PublicKey('miF9saGY5WS747oia48WR3CMFZMAGG8xt6ajB7rdV3e');

  // public keys
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');

  // program
  const idl = (await Program.fetchIdl(poolsId.toString())) as Idl;
  // @ts-ignore
  const program = new Program(idl, poolsId);

  // PDAs
  const accounts = {
    vault: await pda([utf8.encode('vault'), pool.toBuffer()], poolsId),
    rewardsReflection: await pda([utf8.encode('reflection')], rewardsId),
    rewardsVault: await pda([mint.toBuffer()], rewardsId),
    pool,
    authority: provider.wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    rewardsProgram: rewardsId,
  };

  // claim from pool
  console.log(`https://explorer.solana.com/tx/${await program.methods.claimFee().accounts(accounts).rpc()}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

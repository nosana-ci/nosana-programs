import { AnchorProvider, Program, setProvider, web3, BN, Idl } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NosanaPools } from '../target/types/nosana_pools';
import { pda } from '../tests/utils';
import poolConfig = require('../pool.json');
import poolKey = require(poolConfig.poolKey);

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // pool config
  const keyPair = Keypair.fromSecretKey(new Uint8Array(poolKey));

  // public keys
  const mint = new PublicKey(poolConfig.mint);
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');

  // program
  const idl = (await Program.fetchIdl(poolsId.toString())) as Idl;
  const program = new Program(idl, poolsId) as unknown as Program<NosanaPools>;

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

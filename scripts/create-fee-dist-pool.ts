import { AnchorProvider, Program, setProvider, web3, BN } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// @ts-ignore
import { NosanaPools } from '../target/types/nosana_pools';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // pool config
  const poolConfig = require('../pool.json');
  const keyPair = Keypair.fromSecretKey(new Uint8Array(require(poolConfig.poolKey)));

  // public keys
  const mint = new PublicKey(poolConfig.mint);
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');

  // program
  const idl = await Program.fetchIdl(poolsId.toString());
  const program = new Program(idl, poolsId) as Program<NosanaPools>;

  // PDAs
  const accounts = {
    authority: provider.wallet.publicKey,
    beneficiary: (await PublicKey.findProgramAddress([mint.toBuffer()], rewardsId))[0],
    mint,
    pool: keyPair.publicKey,
    rent: web3.SYSVAR_RENT_PUBKEY,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    vault: (await PublicKey.findProgramAddress([utf8.encode('vault'), keyPair.publicKey.toBuffer()], poolsId))[0],
  };

  // open pool
  let tx = await program.methods
    .open(new BN(poolConfig.emission), new BN(poolConfig.startTime), poolConfig.claimType, poolConfig.closeable)
    .accounts(accounts)
    .signers([keyPair])
    .rpc();
  console.log(`https://explorer.solana.com/tx/${tx}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

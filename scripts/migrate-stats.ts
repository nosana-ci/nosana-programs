import { AnchorProvider, Idl, Program, setProvider, web3 } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { PublicKey } from '@solana/web3.js';
import { pda } from '../tests/utils';
// @ts-ignore
import { NosanaRewards } from '../target/types/nosana_rewards';
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // setup js programd
  const programId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
  const mint = new PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaRewards>;

  const reflection = await pda([utf8.encode('reflection')], programId);
  const stats = await pda([utf8.encode('stats')], programId);

  // init vault
  const tx = await program.methods
    .migrateStats()
    .accounts({
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
      vault: await pda([mint.toBuffer()], programId),
      reflection,
      stats,
      authority: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log(`https://explorer.solana.com/address/${reflection.toBase58()}/anchor-account?cluster=devnet`);
  console.log(`https://explorer.solana.com/address/${stats.toBase58()}/anchor-account?cluster=devnet`);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

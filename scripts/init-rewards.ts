import { AnchorProvider, Idl, Program, setProvider, web3 } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { PublicKey } from '@solana/web3.js';

// @ts-ignore
import { NosanaRewards } from '../target/types/nosana_rewards';
import { pda } from '../tests/utils';

async function main() {
  // anchor
  setProvider(AnchorProvider.env());

  // setup js programd
  const programId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaRewards>;

  // init vault
  const tx = await program.methods
    .init()
    .accounts({
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
      stats: await pda([mint.toBuffer()], programId),
      vault: await pda([utf8.encode('stats')], programId),
      mint,
    })
    .rpc();
  console.log(`https://explorer.solana.com/tx/${tx}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

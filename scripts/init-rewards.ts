import { AnchorProvider, Program, setProvider, web3 } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { PublicKey } from '@solana/web3.js';

// @ts-ignore
import { NosanaRewards } from '../target/types/nosana_rewards';

async function main() {
  // anchor
  setProvider(AnchorProvider.env());

  // setup js programd
  const programId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
  const idl = await Program.fetchIdl(programId.toString());
  const program = new Program(idl, programId) as Program<NosanaRewards>;

  // PDAs
  const accounts = {
    // solana native
    systemProgram: web3.SystemProgram.programId,
    rent: web3.SYSVAR_RENT_PUBKEY,
    stats: undefined,
    vault: undefined,
    mint,
  };
  [accounts.vault] = await PublicKey.findProgramAddress([mint.toBuffer()], programId);
  [accounts.stats] = await PublicKey.findProgramAddress([utf8.encode('stats')], programId);

  // init vault
  const tx = await program.methods.init().accounts(accounts).rpc();
  console.log(`https://explorer.solana.com/tx/${tx}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

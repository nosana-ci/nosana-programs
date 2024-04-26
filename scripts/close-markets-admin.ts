import { AnchorProvider, Program, setProvider, Wallet, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
// @ts-ignore
import { NosanaJobs } from '../target/types/nosana_jobs';
import { pda } from '../tests/utils';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as Wallet;

  // public keys
  // const programId = new PublicKey('nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR');
  // const mint = new PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
  const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');

  // program
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaJobs>;
  const markets = await program.account.marketAccount.all();

  for (const market of markets) {
    // open pool
    const tx = await program.methods
      .closeAdmin()
      .accounts({
        user: await getAssociatedTokenAddress(mint, new PublicKey('FEEw3nDocYSyrLT4HPjibjYuaNekakWNmasNvEx3nHKi')),
        authority: wallet.publicKey,
        market: market.publicKey,
        vault: await pda([market.publicKey.toBuffer(), mint.toBuffer()], programId),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    // log data
    console.log(`https://explorer.solana.com/address/${market.publicKey}`);
    console.log(`https://explorer.solana.com/tx/${tx}`);
  }
}

console.log('Running client.');
main().then(() => console.log('Success'));

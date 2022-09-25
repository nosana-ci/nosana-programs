import { AnchorProvider, Program, setProvider, Wallet, web3, BN, Idl } from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
// @ts-ignore
import { NosanaJobs } from '../target/types/nosana_jobs';
import { constants } from '../tests/contstants';
import { pda } from '../tests/utils';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as Wallet;

  // throw away keypair
  const marketKey = Keypair.generate();

  // public keys
  const mint = new PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');
  const market = marketKey.publicKey;
  const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');

  // program
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaJobs>;

  // open pool
  const tx = await program.methods
    .init(
      new BN(100 * constants.decimals), // job price = 1 NOS
      new BN(60 * 60), // job timeout = 1 hour
      constants.jobType.default, // job type = default
      new BN(10_000 * constants.decimals) // minimum stake = 10,000.- NOS
    )
    .accounts({
      mint,
      market,
      vault: await pda([market.toBuffer(), mint.toBuffer()], programId),
      authority: wallet.publicKey,
      accessKey: new PublicKey('nftNgYSG5pbwL7kHeJ5NeDrX8c4KrG1CzWhEXT8RMJ3'),
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([marketKey])
    .rpc();

  // log data
  console.log(`https://explorer.solana.com/address/${market}?cluster=devnet`);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

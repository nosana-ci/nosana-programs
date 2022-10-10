import { AnchorProvider, Program, setProvider, Wallet, web3, BN, Idl } from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
// @ts-ignore
import { NosanaJobs } from '../target/types/nosana_jobs';
import { getDummyKey, pda } from '../tests/utils';
import MarketConfig = require('../tests/data/market.json');

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as Wallet;

  // throw away keypair
  const marketKey = Keypair.generate();

  // public keys
  const mint = new PublicKey(MarketConfig.mint);
  const market = marketKey.publicKey;
  const jobKey = getDummyKey();
  const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');

  // program
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaJobs>;

  // open pool
  const tx = await program.methods
    .open(
      new BN(MarketConfig.jobExpiration),
      new BN(MarketConfig.jobPrice),
      new BN(MarketConfig.jobType),
      MarketConfig.jobType,
      new BN(MarketConfig.nodeMinimumStake)
    )
    .accounts({
      job: jobKey.publicKey,
      mint,
      market,
      vault: await pda([market.toBuffer(), mint.toBuffer()], programId),
      authority: wallet.publicKey,
      accessKey: new PublicKey(MarketConfig.nodeAccessKey),
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([jobKey, marketKey])
    .rpc();

  // log data
  console.log(`https://explorer.solana.com/address/${market}?cluster=devnet`);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

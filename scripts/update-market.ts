import { AnchorProvider, Program, setProvider, BN, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
// @ts-ignore
import { NosanaJobs } from '../target/types/nosana_jobs';
import MarketConfig = require('../tests/data/market.json');

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // public keys
  const market = new PublicKey(MarketConfig.market);
  const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');

  // program
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaJobs>;

  // open pool
  const tx = await program.methods
    .update(
      new BN(MarketConfig.jobPrice),
      new BN(MarketConfig.jobType),
      MarketConfig.jobType,
      new BN(MarketConfig.nodeMinimumStake),
    )
    .accounts({
      market,
      accessKey: new PublicKey(MarketConfig.nodeAccessKey),
    })
    .rpc();

  // log data
  console.log(`https://explorer.solana.com/address/${market}/anchor-account?cluster=devnet`);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  console.log('MarketConfig', MarketConfig);
}

console.log('Running client.');
main().then(() => console.log('Success'));

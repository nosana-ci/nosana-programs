// @ts-ignore
import { AnchorProvider, Program, setProvider, BN, Idl } from '@anchor-lang/core';
import { PublicKey } from '@solana/web3.js';
// @ts-ignore
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
  // @ts-ignore
  const program = new Program(idl, programId);

  // open pool
  const tx = await program.methods
    .update(
      new BN(MarketConfig.jobExpiration),
      new BN(MarketConfig.jobPrice),
      MarketConfig.jobType,
      new BN(MarketConfig.nodeMinimumStake),
      new BN(MarketConfig.jobTimeout),
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

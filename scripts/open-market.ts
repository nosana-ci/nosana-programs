import { web3, BN } from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { pda, setupAnchorAndPrograms, solanaExplorer } from '../tests/utils';
import MarketConfig = require('../tests/data/market.json');

async function main() {
  const { wallet, programs } = await setupAnchorAndPrograms();
  const program = programs.jobs;

  // throw away keypair
  const marketKey = Keypair.generate();

  // public keys
  const mint = new PublicKey(MarketConfig.mint);
  const market = marketKey.publicKey;

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
      mint,
      market,
      vault: await pda([market.toBuffer(), mint.toBuffer()], program.programId),
      authority: wallet.publicKey,
      accessKey: new PublicKey(MarketConfig.nodeAccessKey),
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([marketKey])
    .rpc();

  // log data
  solanaExplorer(market.toString());
  solanaExplorer(tx);
}

console.log('Running client.');
main().then(() => console.log('Success'));

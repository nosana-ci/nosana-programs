import { web3, BN } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  transfer,
} from '@solana/spl-token';
import { pda, ask, solanaExplorer, setupAnchorAndPrograms } from '../tests/utils';
import { constants } from '../tests/contstants';
import poolConfigs = require('./../tests/data/pools.json');

async function main() {
  const { provider, wallet, programs } = await setupAnchorAndPrograms();
  const program = programs.pools;

  // readline
  for (const poolConfig of poolConfigs) {
    console.log(`\nStart time: ${new Date(poolConfig.startTime * 1000)}`);
    console.log(poolConfig);

    if (await ask('\n\nShould we create this vesting?')) {
      console.log('Lets go!');

      // public keys
      const throwAwayKeypair = Keypair.generate();
      const mint = new PublicKey(poolConfig.mint);
      const beneficiary = new PublicKey(poolConfig.beneficiary);
      const vault = await pda([utf8.encode('vault'), throwAwayKeypair.publicKey.toBuffer()], program.programId);

      // creating ATA
      const beneficiaryAta = await getAssociatedTokenAddress(mint, beneficiary);
      console.log(`Creating ATA:\n${solanaExplorer(beneficiaryAta.toString())}\n`);
      await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mint, beneficiary);

      // the pool and vault
      console.log(`Creating pool:\n${solanaExplorer(throwAwayKeypair.publicKey.toString(), true)}\n`);
      console.log(`Creating vault:\n${solanaExplorer(vault.toString())}\n`);
      let tx = await program.methods
        .open(new BN(poolConfig.emission), new BN(poolConfig.startTime), poolConfig.claimType, poolConfig.closeable)
        .accounts({
          authority: wallet.publicKey,
          beneficiary: beneficiaryAta,
          mint,
          pool: throwAwayKeypair.publicKey,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          vault,
        })
        .signers([throwAwayKeypair])
        .rpc();
      console.log(`Done!\n${solanaExplorer(tx)}`);

      if (await ask('\n\nShould we fill the vesting?')) {
        console.log('Filling pool');
        tx = await transfer(
          provider.connection,
          wallet.payer,
          await getAssociatedTokenAddress(mint, provider.wallet.publicKey),
          vault,
          wallet.payer,
          poolConfig.amount * constants.decimals
        );
        console.log(`Done!\n${solanaExplorer(tx)}`);
      }
    }
  }
}

console.log('Running client.');
main().then(() => console.log('Success'));

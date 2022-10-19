import { AnchorProvider, Program, setProvider, Wallet, web3, BN, Idl } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  transfer,
} from '@solana/spl-token';
import { pda } from '../tests/utils';
import { constants } from '../tests/contstants';
import poolConfigs = require('./../tests/data/pools.json');
// @ts-ignore
import { NosanaPools } from '../target/types/nosana_pools';

import { createInterface } from 'readline';

async function ask(q) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.setPrompt(q);
  readline.prompt();

  let response;
  return new Promise((resolve) => {
    readline.on('line', (userInput) => {
      response = userInput;
      readline.close();
    });

    readline.on('close', () => {
      resolve(response);
    });
  });
}

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as Wallet;

  // program
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const idl = (await Program.fetchIdl(poolsId.toString())) as Idl;
  const program = new Program(idl, poolsId) as unknown as Program<NosanaPools>;

  // readline

  for (const poolConfig of poolConfigs) {
    console.log(`\nStart time: ${new Date(poolConfig.startTime * 1000)}`);
    console.log(poolConfig);

    const answer1 = await ask('\n\nShould we create this vesting? [yes/no]\n');
    console.log(`Your answer is ${answer1}`);

    if (answer1 === 'yes') {
      // pool config
      const throwAwayKeypair = Keypair.generate();

      console.log('Lets go!');
      // public keys
      const mint = new PublicKey(poolConfig.mint);
      const beneficiary = new PublicKey(poolConfig.beneficiary);
      const vault = await pda([utf8.encode('vault'), throwAwayKeypair.publicKey.toBuffer()], poolsId);

      // creating ATA
      const beneficiaryAta = await getAssociatedTokenAddress(mint, beneficiary);
      console.log(`Creating ATA: ${beneficiaryAta.toString()}`);
      await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, mint, beneficiary);

      // the pool and vault
      console.log(`Creating pool: ${throwAwayKeypair.publicKey.toString()}`);
      console.log(`Creating vault: ${vault.toString()}`);
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
      console.log(`https://explorer.solana.com/tx/${tx}`);

      const answer2 = await ask('\n\nShould we fill the vesting? [yes/no]\n');
      if (answer2 === 'yes') {
        console.log('Filling pool');
        tx = await transfer(
          provider.connection,
          wallet.payer,
          await getAssociatedTokenAddress(mint, provider.wallet.publicKey),
          vault,
          wallet.payer,
          poolConfig.amount * constants.decimals
        );
        console.log(`https://explorer.solana.com/tx/${tx}`);
      }
    }
  }
}

console.log('Running client.');
main().then(() => console.log('Success'));

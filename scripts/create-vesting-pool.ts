import { AnchorProvider, Program, setProvider, Wallet, web3, BN, Idl } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, transfer } from '@solana/spl-token';
import { pda } from '../tests/utils';
import vestingConfig = require('../tests/data/vesting.json');
// @ts-ignore
import { NosanaPools } from '../target/types/nosana_pools';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as Wallet;

  // pool config
  const throwAwayKeypair = Keypair.generate();

  // public keys
  const mint = new PublicKey(vestingConfig.mint);
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const beneficiary = new PublicKey(vestingConfig.beneficiary);

  // program
  const idl = (await Program.fetchIdl(poolsId.toString())) as Idl;
  const program = new Program(idl, poolsId) as unknown as Program<NosanaPools>;

  // PDAs
  const accounts = {
    authority: wallet.publicKey,
    beneficiary: await getAssociatedTokenAddress(mint, beneficiary),
    mint,
    pool: throwAwayKeypair.publicKey,
    rent: web3.SYSVAR_RENT_PUBKEY,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    vault: await pda([utf8.encode('vault'), throwAwayKeypair.publicKey.toBuffer()], poolsId),
  };

  // open pool
  let tx = await program.methods
    .open(
      new BN(vestingConfig.emission),
      new BN(vestingConfig.startTime),
      vestingConfig.claimType,
      vestingConfig.closeable
    )
    .accounts(accounts)
    .signers([throwAwayKeypair])
    .rpc();
  console.log(`https://explorer.solana.com/tx/${tx}`);

  // fund pool
  tx = await transfer(
    provider.connection,
    wallet.payer,
    await getAssociatedTokenAddress(mint, provider.wallet.publicKey),
    accounts.vault,
    wallet.payer,
    vestingConfig.amount * 1e6
  );
  console.log(`https://explorer.solana.com/tx/${tx}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

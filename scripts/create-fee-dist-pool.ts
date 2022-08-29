import { AnchorProvider, Program, setProvider, web3, BN } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { NosanaPools } from '../target/types/nosana_pools';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  const emission = 253678; // lamport-NOS per second
  const start_time = 1661780725; // 08/29/2022 @ 1:45pm
  const closeable = true;

  // public keys
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
  const mint = new PublicKey('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP');

  // the vanity address for this pool
  const keyPair = Keypair.fromSecretKey(new Uint8Array(require('../poF4cdcnisqUSBCbfvf4T9Hmvz1sTdhfhGzfPqoQZks.json')));

  // program
  const idl = await Program.fetchIdl(poolsId.toString());
  const program = new Program(idl, poolsId) as Program<NosanaPools>;

  // PDAs
  const accounts = {
    authority: provider.wallet.publicKey,
    beneficiary: (await PublicKey.findProgramAddress([mint.toBuffer()], rewardsId))[0],
    mint: mint,
    pool: keyPair.publicKey,
    rent: web3.SYSVAR_RENT_PUBKEY,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    user: await getAssociatedTokenAddress(mint, provider.wallet.publicKey),
    vault: (await PublicKey.findProgramAddress([utf8.encode('vault'), keyPair.publicKey.toBuffer()], poolsId))[0],
  };

  // open pool
  let tx = await program.methods
    .open(new BN(emission), new BN(start_time), closeable)
    .accounts(accounts)
    .signers([keyPair])
    .rpc();
  console.log(tx);
}

console.log('Running client.');
main().then(() => console.log('Success'));

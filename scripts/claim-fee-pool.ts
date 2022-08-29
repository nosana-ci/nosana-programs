import { AnchorProvider, Program, setProvider, web3, BN } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { NosanaPools } from '../target/types/nosana_pools';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // CHANGE: the ID of the pool to claim from
  const pool = new PublicKey('miF9saGY5WS747oia48WR3CMFZMAGG8xt6ajB7rdV3e');

  // public keys
  const poolsId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');

  // program
  const idl = await Program.fetchIdl(poolsId.toString());
  const program = new Program(idl, poolsId) as Program<NosanaPools>;

  // PDAs
  const accounts = {
    vault: (await PublicKey.findProgramAddress([utf8.encode('vault'), keyPair.publicKey.toBuffer()], poolsId))[0],
    rewardsStats: (await PublicKey.findProgramAddress([utf8.encode('stats')], rewardsId))[0],
    rewardsVault: (await PublicKey.findProgramAddress([mint.toBuffer()], rewardsId))[0],
    pool: keyPair.publicKey,
    authority: provider.wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    rewardsProgram: rewardsId,
    systemProgram: web3.SystemProgram.programId,
  };

  // open pool
  let tx = await program.methods
    .claimFee()
    .accounts(accounts)
    .rpc();
  console.log(tx);
}

console.log('Running client.');
main().then(() => console.log('Success'));

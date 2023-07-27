import { AnchorProvider, Program, setProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { utf8 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { pda } from '../tests/utils';
import poolConfig = require('../tests/data/pool.json');
// @ts-ignore
import { NosanaNodes } from '../target/types/nosana_nodes';

async function main() {
  // anchor
  const provider = AnchorProvider.env();
  setProvider(provider);

  // pool config
  const keyPair = Keypair.generate();

  // public keys
  const mint = new PublicKey(poolConfig.mint);
  const nodesId = new PublicKey('nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD');
  const nodeAddr = new PublicKey('nodCMAdrGT3oLduvsLMFUp7SMovyaDVJ4kVumz65j7M');

  // program
  const idl = (await Program.fetchIdl(nodesId.toString())) as Idl;
  const program = new Program(idl, nodesId) as unknown as Program<NosanaNodes>;

  const nodePda = await pda([utf8.encode('node'), provider.wallet.publicKey.toBuffer()], nodesId);

  const accounts = {
    node: nodePda,
    payer: provider.wallet.publicKey,
    authority: provider.wallet.publicKey,
    systemProgram: web3.SystemProgram.programId
  };

  const nodeSpec = {
    architectureType: 0,
    countryCode: 528,
    cpu: 8,
    gpu: 0,
    memory: 27,
    iops: 1000,
    storage: 985,
    endpoint: 'https://nosana.io',
    version: 'v1.0.0',
  };

  const tx = await program.methods
    .register(
      nodeSpec.architectureType,
      nodeSpec.countryCode,
      nodeSpec.cpu,
      nodeSpec.gpu,
      nodeSpec.memory,
      nodeSpec.iops,
      nodeSpec.storage,
      nodeSpec.endpoint,
      // 'https://arweave.net/gA2S3TKamHnTD7vb704bYZc7-PheFUkx1igrIrnBUvo',
      '',
      nodeSpec.version
    )
    .accounts(accounts)
    .rpc();

  console.log(`https://explorer.solana.com/tx/${tx}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

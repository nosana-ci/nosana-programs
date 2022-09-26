import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { PublicKey } from '@solana/web3.js';
import { pda } from '../tests/utils';

async function main() {
  const programId = new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
  const authority = new PublicKey(process.argv.slice(2)[0]);
  const address = await pda([utf8.encode('stake'), mint.toBuffer(), authority.toBuffer()], programId);
  console.log(`https://explorer.solana.com/address/${address}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

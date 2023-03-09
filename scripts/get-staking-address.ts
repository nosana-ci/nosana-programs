import { utf8 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { PublicKey } from '@solana/web3.js';
import { pda } from '../tests/utils';

async function main() {
  const pk = await pda(
    [
      utf8.encode('stake'),
      new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7').toBuffer(),
      new PublicKey(process.argv.slice(2)[0]).toBuffer(),
    ],
    new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE')
  );
  console.log(`https://explorer.solana.com/address/${pk}`);
}

console.log('Running client.');
main().then(() => console.log('Success'));

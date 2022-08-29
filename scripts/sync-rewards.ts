import { NosanaRewards } from '../target/types/nosana_rewards';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { sleep } from '@project-serum/common';

const provider = AnchorProvider.env();
setProvider(provider);

async function main() {
  // public keys
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
  const stakingId = new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');

  // setup program
  const idl = await Program.fetchIdl(rewardsId.toString());
  const program = new Program(idl, rewardsId) as Program<NosanaRewards>;

  // parse CSV
  type Stakers = {
    address: string;
    amount: number;
    duration: number;
    xnos: number;
  };
  let rows = [{}] as Stakers[];
  parse(
    fs.readFileSync(path.resolve(__dirname, 'stakers.csv'), { encoding: 'utf-8' }),
    {
      delimiter: ',',
      columns: ['address', 'amount', 'duration', 'xnos'],
    },
    async (error, result: Stakers[]) => {
      if (error) {
        console.error(error);
        throw error;
      }
      rows = result;
    }
  );

  // PDAs
  const accounts = {
    stats: undefined,
    stake: undefined,
    reward: undefined,
  };
  [accounts.stats] = await PublicKey.findProgramAddress([utf8.encode('stats')], rewardsId);

  for (const row of rows) {
    if (row.address === 'address') continue;
    const authority = new PublicKey(row.address);
    [accounts.reward] = await PublicKey.findProgramAddress([utf8.encode('reward'), authority.toBuffer()], rewardsId);
    [accounts.stake] = await PublicKey.findProgramAddress(
      [utf8.encode('stake'), mint.toBuffer(), authority.toBuffer()],
      stakingId
    );
    let tx = await program.methods.sync().accounts(accounts).rpc();
    await sleep(5000);
    console.log(tx);
  }
}

console.log('Running client.');
main().then(() => console.log('Success'));

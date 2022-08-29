import { NosanaRewards } from '../target/types/nosana_rewards';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse';
import { PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider } from '@project-serum/anchor';
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { sleep } from '@project-serum/common';

async function main() {
  // setup anchor
  const provider = setProvider(AnchorProvider.env());

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
    readFileSync(resolve(__dirname, 'stakers.csv'), { encoding: 'utf-8' }),
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

  let instructions = [];
  for (const row of rows) {
    if (row.address === 'address') continue; // skip the header row
    const authority = new PublicKey(row.address);
    [accounts.reward] = await PublicKey.findProgramAddress([utf8.encode('reward'), authority.toBuffer()], rewardsId);
    [accounts.stake] = await PublicKey.findProgramAddress(
      [utf8.encode('stake'), mint.toBuffer(), authority.toBuffer()],
      stakingId
    );

    // 10 sync instructions in 1 tx seems to be the max
    if (instructions.length === 10) {
      await sleep(10); // give the rpc nodes some slack
      const tx = await program.methods.sync().accounts(accounts).preInstructions(instructions).rpc();
      console.log(tx);
      // reset instructions
      instructions = [];
    } else instructions.push(await program.methods.sync().accounts(accounts).instruction());
  }
}

console.log('Running client.');
main().then(() => console.log('Success'));

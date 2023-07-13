import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, setProvider, Idl } from '@coral-xyz/anchor';
import { utf8 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { pda } from '../tests/utils';
// @ts-ignore
import { NosanaRewards } from '../target/types/nosana_rewards';

async function main() {
  // setup anchor
  setProvider(AnchorProvider.env());

  // public keys
  const mint = new PublicKey('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7');
  const rewardsId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
  const stakingId = new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');

  // setup program
  const idl = (await Program.fetchIdl(rewardsId.toString())) as Idl;
  const program = new Program(idl, rewardsId) as unknown as Program<NosanaRewards>;

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
    },
  );

  type SyncAccounts = {
    stats: PublicKey;
    stake: PublicKey;
    reward: PublicKey;
  };
  // PDAs
  const accounts = {} as SyncAccounts;
  accounts.stats = await pda([utf8.encode('stats')], rewardsId);

  let instructions = [];
  for (const row of rows) {
    if (row.address === 'address') continue; // skip the header row
    const authority = new PublicKey(row.address);
    accounts.reward = await pda([utf8.encode('reward'), authority.toBuffer()], rewardsId);
    accounts.stake = await pda([utf8.encode('stake'), mint.toBuffer(), authority.toBuffer()], stakingId);

    // 13 sync instructions in 1 tx seems to be the max without (Error: Transaction too large: XXXX > 1232)
    if (instructions.length === 12 || row === rows[rows.length - 1]) {
      const tx = await program.methods.sync().accounts(accounts).preInstructions(instructions).rpc();
      console.log(`https://explorer.solana.com/tx/${tx}`);
      instructions = []; // reset instructions
    } else instructions.push(await program.methods.sync().accounts(accounts).instruction());
  }
}

console.log('Running client.');
main().then(() => console.log('Success'));

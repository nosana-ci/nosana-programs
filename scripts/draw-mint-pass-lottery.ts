import * as fs from 'fs';
import { AnchorProvider, Idl, Program, setProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
// @ts-ignore
import { NosanaStaking } from '../target/types/nosana_staking';
import { sleep } from '../tests/utils';
import { default as seedrandom } from 'seedrandom';

const date = new Date();

const outPrefix = `./${date.getUTCFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}_`;
const ticketsFile = `${outPrefix}_tickets.csv`;
const winnersFile = `${outPrefix}_winners.csv`;

const waitForBlock = parseInt(process.argv.slice(2)[0]);
const totalDraws = parseInt(process.argv.slice(2)[1]);

/**
 * Returns a vector of tier edges. The index in the array is the Tier
 * and the value is the rank at which that tier ends.
 * E.g. tiers[4] = 19 (Kraken).
 */
const getTiers = (maxRank) => [
  maxRank,
  Math.floor(0.2 * maxRank) + Math.floor(0.2 * maxRank) + Math.floor(0.2 * maxRank) + 20,
  Math.floor(0.2 * maxRank) + Math.floor(0.2 * maxRank) + 20,
  Math.floor(0.2 * maxRank + 20),
  20,
];

// Below imlementation is more straighforward but has different rounding than the frontend:
// const getTiers = (maxRank) => [1.0, 0.6, 0.4, 0.2, 0.0].map(
// i => Math.round(19 + i * (maxRank - 1))
// );

/**
 * Calculate how many tickets users get based on their rank and the tiers.
 */
const calculateTickets = (rank, tiers) => {
  const tickets = [1, 3, 6, 15, 0];
  for (let tier = 4; tier >= 0; tier--) {
    if (rank < tiers[tier]) return tickets[tier];
  }
  return 0;
};

/**
 * Create a CSV file with the stakes
 */
async function makeTicketsCsv() {
  const provider = AnchorProvider.env();
  setProvider(provider);

  const programId = new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');
  const idl = (await Program.fetchIdl(programId.toString())) as Idl;
  const program = new Program(idl, programId) as unknown as Program<NosanaStaking>;

  // wait for the specific block near which we want to make the snapshot
  let lastHeight = await provider.connection.getBlockHeight();
  if (waitForBlock) {
    let lastTime = await provider.connection.getBlockTime(lastHeight);
    while (lastTime < waitForBlock) {
      console.log(`Waiting ${waitForBlock - lastTime} more seconds (${lastTime})`);
      await sleep(1.5);
      lastHeight = await provider.connection.getBlockHeight();
      lastTime = await provider.connection.getBlockTime(lastHeight);
    }
  }
  const blockhash = (await provider.connection.getBlock(lastHeight, { commitment: 'finalized' })).blockhash;
  console.log(`Using block ${lastHeight} for PRNG seed: ${blockhash}`);

  const stakes = await program.account.stakeAccount.all([]);

  console.log(`Found ${stakes.length} stakes`);

  const minXnos = new BN(1000).mul(new BN(1e6));
  const ranks = stakes
    .map((e) => e.account)
    .filter((e) => e.xnos.gt(minXnos))
    .sort((e1, e2) => (e1.xnos.gt(e2.xnos) ? -1 : 1));

  console.log(`Found ${ranks.length} qualified stakes`);
  const tiers = getTiers(ranks.length);

  const tickets = ranks.map((e, i) => [e.authority.toString(), e.xnos.toString(), calculateTickets(i, tiers)]);

  const ticketsCsv = tickets.map((e) => e.join(',')).join('\n');
  fs.writeFileSync(ticketsFile, ticketsCsv);
  console.log(`Wrote tickets CSV to ${ticketsFile}`);

  return [blockhash, tickets];
}

/**
 * Create a CSV file with the winners
 */
function drawWinners(seed, tickets) {
  const prng = seedrandom(seed);

  // array of the winning user addresses
  const selected = tickets.reduce((v, [addr, , n]) => (n == 0 ? v.concat(addr) : v), []);

  // keeps track of remaining vote weight of all electible users
  let totalWeight = tickets.reduce((tot, row) => tot + (row[2] as number), 0);

  // holds {"user-address" => # tickets} for the users that are electible for draw
  const userWeight = tickets.reduce((map, [auth, , n]) => map.set(auth, n), new Map());

  const leftToDraw = totalDraws - selected.length;
  for (let i = 0; i < leftToDraw; i++) {
    // pick a point on the ticket weight scale
    const draw = Math.floor(prng() * totalWeight);

    // find and select the user on this point
    let idx = 0;
    for (const [user, tickets] of userWeight) {
      idx += tickets;

      if (idx > draw) {
        selected.push(user);
        userWeight.delete(user);
        totalWeight -= tickets;
        break;
      }
    }
  }

  const winnersCsv = selected.reduce((s, addr) => s + `\n${addr},1,`, 'recipient,amount,lockup_date');
  fs.writeFileSync(winnersFile, winnersCsv);
  console.log(
    `Wrote winners CSV to ${winnersFile}. Use as:

solana-tokens distribute-tokens --from <KEYPAIR>` +
      ` --input-csv ${winnersFile} --fee-payer <KEYPAIR>
`
  );
}

console.log('Drawing Burner Phone Lottery.');
makeTicketsCsv().then(([seed, res]) => {
  drawWinners(seed, res);
  console.log('Done!');
});

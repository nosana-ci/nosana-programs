#!/usr/bin/env ts-node
/*
 * close-buffers.ts — export unsigned base58 transaction(s) that close BPF
 * Upgradeable Loader buffer accounts, reclaiming their rent lamports.
 *
 * Buffers left behind by aborted/superseded deploys (the ones listed by
 * `solana program show --buffers --buffer-authority <SQUADS_PUBKEY>`) can only
 * be closed by their authority. When that authority is the Squads vault, the
 * close has to go through the multisig — so instead of sending, this script
 * exports the transaction(s) for import in Squads under
 * developers/txBuilder/ImportAsBase58 (no CLI exports this instruction, so we
 * build it by hand).
 *
 * Usage:
 *   npm run script:close-buffers -- [buffer ...] [options]
 *
 * With no positional arguments it fetches ALL buffer accounts whose authority
 * is `--authority` from the RPC (the same filter the Solana CLI uses).
 * Positional buffer addresses restrict the close to just those accounts; each
 * one is verified to be a live buffer owned by the expected authority.
 *
 *   --authority <pubkey>   buffer authority / signer (default: SQUADS_PUBKEY)
 *   --recipient <pubkey>   recipient of the reclaimed rent (default: authority)
 *   --rpc <url>            RPC endpoint (default: $RPC_URL, $ANCHOR_PROVIDER_URL,
 *                          or the public mainnet-beta endpoint)
 *   -o, --output <file>    output file (default: close-buffers.tx); when the
 *                          closes do not fit in one transaction, numbered
 *                          variants are written (close-buffers-1.tx, ...)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as bs58 from 'bs58';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

// The Squads vault that acts as fee-payer, buffer authority and rent recipient.
// Mirrors SQUADS_PUBKEY in .gitlab-ci.yml.
const SQUADS_PUBKEY = new PublicKey('GXs53JMXbgdMDhtmjE9iNgSmC1gu8f3adZhXuCEq1Bx9');

// BPF Upgradeable Loader — not exported by this @solana/web3.js version.
const BPF_LOADER_UPGRADEABLE = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

// UpgradeableLoaderState::Buffer, bincode-encoded:
//   u32 enum tag (1 = Buffer) | Option<Pubkey> authority (1-byte flag + 32 bytes)
const BUFFER_TAG = Buffer.from([1, 0, 0, 0]);
const AUTHORITY_OFFSET = 4;

function usage(msg?: string): never {
  if (msg) console.error('error: ' + msg);
  console.error('usage: npm run script:close-buffers -- [buffer ...] [options]');
  console.error('  --authority <pubkey>  buffer authority / signer (default: SQUADS_PUBKEY)');
  console.error('  --recipient <pubkey>  rent recipient (default: authority)');
  console.error('  --rpc <url>           RPC endpoint (default: $RPC_URL or $ANCHOR_PROVIDER_URL)');
  console.error('  -o, --output <file>   output file (default: close-buffers.tx)');
  process.exit(msg ? 1 : 0);
}

// --- parse args ---
const argv = process.argv.slice(2);
let output = path.join(path.dirname(fs.realpathSync(__filename)), 'close-buffers.tx');
let authority: PublicKey = SQUADS_PUBKEY;
let recipient: PublicKey | null = null;
let rpc = process.env.RPC_URL || process.env.ANCHOR_PROVIDER_URL || 'https://api.mainnet-beta.solana.com';
const explicitBuffers: PublicKey[] = [];

function pubkeyArg(v: string | undefined, flag: string): PublicKey {
  if (!v) usage(`${flag} requires a public key`);
  try {
    return new PublicKey(v);
  } catch {
    usage(`${flag}: '${v}' is not a valid public key`);
  }
}

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-h' || a === '--help') usage();
  else if (a === '-o' || a === '--output') output = argv[++i];
  else if (a === '--authority') authority = pubkeyArg(argv[++i], a);
  else if (a === '--recipient') recipient = pubkeyArg(argv[++i], a);
  else if (a === '--rpc') rpc = argv[++i];
  else explicitBuffers.push(pubkeyArg(a, 'buffer'));
}
const spill = recipient ?? authority;

// --- BPF Upgradeable Loader `close` instruction (variant 5) ---
function closeInstruction(buffer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: BPF_LOADER_UPGRADEABLE,
    keys: [
      { pubkey: buffer, isSigner: false, isWritable: true },
      { pubkey: spill, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([5, 0, 0, 0]),
  });
}

// --- find the buffer accounts to close ---
async function findBuffers(connection: Connection): Promise<{ pubkey: PublicKey; lamports: number }[]> {
  if (explicitBuffers.length) {
    const infos = await connection.getMultipleAccountsInfo(explicitBuffers);
    return explicitBuffers.map((pubkey, i) => {
      const info = infos[i];
      if (!info) throw new Error(`${pubkey.toBase58()}: account not found`);
      if (!info.owner.equals(BPF_LOADER_UPGRADEABLE)) throw new Error(`${pubkey.toBase58()}: not a loader account`);
      if (!info.data.subarray(0, 4).equals(BUFFER_TAG)) throw new Error(`${pubkey.toBase58()}: not a buffer account`);
      const auth = info.data.subarray(AUTHORITY_OFFSET, AUTHORITY_OFFSET + 33);
      if (!auth.equals(Buffer.concat([Buffer.from([1]), authority.toBuffer()]))) {
        throw new Error(`${pubkey.toBase58()}: buffer authority is not ${authority.toBase58()}`);
      }
      return { pubkey, lamports: info.lamports };
    });
  }
  // Same filter `solana program show --buffers --buffer-authority` uses.
  const accounts = await connection.getProgramAccounts(BPF_LOADER_UPGRADEABLE, {
    dataSlice: { offset: 0, length: 0 },
    filters: [
      { memcmp: { offset: 0, bytes: bs58.encode(BUFFER_TAG) } },
      {
        memcmp: {
          offset: AUTHORITY_OFFSET,
          bytes: bs58.encode(Buffer.concat([Buffer.from([1]), authority.toBuffer()])),
        },
      },
    ],
  });
  return accounts.map(({ pubkey, account }) => ({ pubkey, lamports: account.lamports }));
}

// --- pack close instructions into as few transactions as fit in 1232 bytes ---
function serializeTx(ixs: TransactionInstruction[]): Buffer {
  const tx = new Transaction();
  ixs.forEach((ix) => tx.add(ix));
  tx.feePayer = authority;
  // Placeholder blockhash — the signing wallet / Squads replaces it before sending.
  tx.recentBlockhash = new PublicKey(0).toBase58();
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false });
}

async function main() {
  const connection = new Connection(rpc);
  const buffers = await findBuffers(connection);
  if (!buffers.length) {
    console.error(`no buffer accounts found with authority ${authority.toBase58()}`);
    return;
  }

  let total = 0;
  for (const b of buffers) {
    console.error(`buffer ${b.pubkey.toBase58()}: ${b.lamports / 1e9} SOL`);
    total += b.lamports;
  }
  console.error(`closing ${buffers.length} buffer(s), reclaiming ${total / 1e9} SOL to ${spill.toBase58()}\n`);

  const chunks: TransactionInstruction[][] = [];
  let current: TransactionInstruction[] = [];
  for (const b of buffers) {
    const candidate = [...current, closeInstruction(b.pubkey)];
    if (current.length && serializeTx(candidate).length > 1232) {
      chunks.push(current);
      current = [closeInstruction(b.pubkey)];
    } else current = candidate;
  }
  chunks.push(current);

  console.error('import below transaction(s) in Squads under developers/txBuilder/ImportAsBase58');
  chunks.forEach((ixs, i) => {
    const file =
      chunks.length === 1 ? output : path.join(path.dirname(output), `${path.basename(output, '.tx')}-${i + 1}.tx`);
    const serialized = serializeTx(ixs);
    const out = bs58.encode(serialized);
    fs.writeFileSync(file, out + '\n');
    console.error(`\n${file}: ${ixs.length} close instruction(s), ${serialized.length} bytes`);
    console.log(out);
  });
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

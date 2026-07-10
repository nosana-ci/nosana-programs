#!/usr/bin/env ts-node
/*
 * combine-txs.ts — combine multiple base58-encoded Solana transactions into one.
 *
 * Usage:
 *   npm run script:combine-txs -- <file1> <file2> [...] [options]
 *
 * From each file it takes the LAST non-empty line (assumed to be a base58
 * transaction), pulls out every instruction, and concatenates them — in the
 * order the files are given — into a single unsigned transaction.
 *
 * Optionally prepends a BPF Upgradeable Loader `upgrade` instruction so the
 * program upgrade can ride along in the same Squads transaction instead of
 * being a separate step in the Squads UI (there is no CLI that exports this
 * instruction, so we build it by hand):
 *
 *   --upgrade <programId> <bufferAddress>   prepend a program-upgrade ix (first)
 *   --spill-account <pubkey>                spill recipient for reclaimed rent
 *                                           (alias: --close-buffer; default: SQUADS_PUBKEY)
 *   --authority <pubkey>                    upgrade authority / signer
 *                                           (default: SQUADS_PUBKEY)
 *   -o, --output <file>                     output file (default: combined.tx)
 *
 * Requirements: the txs must share one fee-payer and use no address lookup
 * tables (ALTs), and the merged tx must fit in 1232 bytes.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as bs58 from 'bs58';
import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  VersionedTransaction,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';

// The Squads vault that acts as fee-payer, upgrade authority and spill account.
// Mirrors SQUADS_PUBKEY in .gitlab-ci.yml.
const SQUADS_PUBKEY = new PublicKey('GXs53JMXbgdMDhtmjE9iNgSmC1gu8f3adZhXuCEq1Bx9');

// BPF Upgradeable Loader — not exported by this @solana/web3.js version.
const BPF_LOADER_UPGRADEABLE = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');

function usage(msg?: string): never {
  if (msg) console.error('error: ' + msg);
  console.error('usage: npm run script:combine-txs -- <file1> <file2> [...] [options]');
  console.error('  --upgrade <programId> <bufferAddress>  prepend a program-upgrade instruction');
  console.error('  --spill-account, --close-buffer <pk>   spill recipient (default: SQUADS_PUBKEY)');
  console.error('  --authority <pubkey>                   upgrade authority (default: SQUADS_PUBKEY)');
  console.error('  -o, --output <file>                    output file (default: combined.tx)');
  process.exit(msg ? 1 : 0);
}

// --- parse args ---
const argv = process.argv.slice(2);
let output = path.join(path.dirname(fs.realpathSync(__filename)), 'combined.tx');
let upgradeProgramId: PublicKey | null = null;
let upgradeBuffer: PublicKey | null = null;
let spillAccount: PublicKey = SQUADS_PUBKEY;
let authority: PublicKey = SQUADS_PUBKEY;
const files: string[] = [];

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
  else if (a === '-u' || a === '--upgrade') {
    upgradeProgramId = pubkeyArg(argv[++i], '--upgrade <programId>');
    upgradeBuffer = pubkeyArg(argv[++i], '--upgrade <bufferAddress>');
  } else if (a === '--spill-account' || a === '--close-buffer') {
    spillAccount = pubkeyArg(argv[++i], a);
  } else if (a === '--authority') {
    authority = pubkeyArg(argv[++i], a);
  } else files.push(a);
}
if (files.length < 1 && !upgradeProgramId) usage('need at least one input file or --upgrade');

// --- read the last non-empty line of a file ---
function lastNonEmpty(p: string): string {
  const lines = fs
    .readFileSync(p, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) throw new Error(`${p}: no non-empty lines`);
  return lines[lines.length - 1];
}

// --- reconstruct full instructions from a serialized tx (legacy or v0, no ALTs) ---
function extractInstructions(b58: string, label: string): { feePayer: PublicKey; ixs: TransactionInstruction[] } {
  const tx = VersionedTransaction.deserialize(bs58.decode(b58));
  const msg = tx.message;
  if (msg.addressTableLookups && msg.addressTableLookups.length) {
    throw new Error(`${label}: uses address lookup tables — cannot merge without resolving them`);
  }
  const keys = msg.staticAccountKeys;
  const h = msg.header;
  const n = keys.length;
  const isSigner = (i: number) => i < h.numRequiredSignatures;
  const isWritable = (i: number) =>
    isSigner(i) ? i < h.numRequiredSignatures - h.numReadonlySignedAccounts : i < n - h.numReadonlyUnsignedAccounts;
  const feePayer = keys[0];
  const ixs = msg.compiledInstructions.map(
    (ix) =>
      new TransactionInstruction({
        programId: keys[ix.programIdIndex],
        keys: ix.accountKeyIndexes.map((idx) => ({
          pubkey: keys[idx],
          isSigner: isSigner(idx),
          isWritable: isWritable(idx),
        })),
        data: Buffer.from(ix.data),
      }),
  );
  return { feePayer, ixs };
}

// --- BPF Upgradeable Loader `upgrade` instruction (variant 3) ---
function upgradeInstruction(
  programId: PublicKey,
  buffer: PublicKey,
  spill: PublicKey,
  upgradeAuthority: PublicKey,
): TransactionInstruction {
  const [programData] = PublicKey.findProgramAddressSync([programId.toBuffer()], BPF_LOADER_UPGRADEABLE);
  return new TransactionInstruction({
    programId: BPF_LOADER_UPGRADEABLE,
    keys: [
      { pubkey: programData, isSigner: false, isWritable: true },
      { pubkey: programId, isSigner: false, isWritable: true },
      { pubkey: buffer, isSigner: false, isWritable: true },
      { pubkey: spill, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: upgradeAuthority, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([3, 0, 0, 0]),
  });
}

// --- build combined tx ---
const combined = new Transaction();
let feePayer: PublicKey | null = null;
let total = 0;

// Program upgrade rides along as the first instruction, if requested.
if (upgradeProgramId && upgradeBuffer) {
  combined.add(upgradeInstruction(upgradeProgramId, upgradeBuffer, spillAccount, authority));
  feePayer = authority;
  total += 1;
  console.error(
    `upgrade: ${upgradeProgramId.toBase58()} from buffer ${upgradeBuffer.toBase58()} (authority ${authority.toBase58()}, spill ${spillAccount.toBase58()})`,
  );
}

for (const f of files) {
  const { feePayer: fp, ixs } = extractInstructions(lastNonEmpty(f), path.basename(f));
  if (!feePayer) feePayer = fp;
  else if (!feePayer.equals(fp)) {
    console.error(
      `warning: ${path.basename(f)} fee-payer ${fp.toBase58()} != ${feePayer.toBase58()} (using the first)`,
    );
  }
  ixs.forEach((ix) => combined.add(ix));
  console.error(`${path.basename(f)}: +${ixs.length} instruction(s)`);
  total += ixs.length;
}

combined.feePayer = feePayer;
// Placeholder blockhash — the signing wallet / Squads replaces it before sending.
combined.recentBlockhash = new PublicKey(0).toBase58();

const serialized = combined.serialize({ requireAllSignatures: false, verifySignatures: false });
if (serialized.length > 1232) {
  console.error(
    `ERROR: combined tx is ${serialized.length} bytes, exceeds the 1232-byte limit — cannot fit in one transaction`,
  );
  process.exit(1);
}
const out = bs58.encode(serialized);
fs.writeFileSync(output, out + '\n');

console.error(`\ncombined ${total} instruction(s) from ${files.length} file(s) → ${serialized.length} bytes`);
console.error(`fee-payer:  ${feePayer.toBase58()}`);
console.error(`blockhash:  placeholder (11111…) — set a fresh one at signing time`);
console.error(`written to: ${output}`);
console.log(out);

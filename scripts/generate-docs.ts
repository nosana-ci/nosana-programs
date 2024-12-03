// @ts-ignore
import NosanaJobs from '../target/idl/nosana_jobs.json';
// @ts-ignore
import NosanaPools from '../target/idl/nosana_pools.json';
// @ts-ignore
import NosanaRewards from '../target/idl/nosana_rewards.json';
// @ts-ignore
import NosanaStaking from '../target/idl/nosana_staking.json';
// @ts-ignore
import NosanaNodes from '../target/idl/nosana_nodes.json';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import commandLineArgs from 'command-line-args';
import { snakeCase } from 'snake-case';
import { sha256 } from 'js-sha256';
import { BorshAccountsCoder } from '@coral-xyz/anchor';

const options = commandLineArgs([
  { name: 'enhance', alias: 'e', type: Boolean },
  { name: 'diagrams', alias: 'd', type: Boolean },
  { name: 'output-dir', alias: 'o', type: String },
]);

// Not technically sighash, since we don't include the arguments, as Rust
// doesn't allow function overloading.
function dispatchId(ixName: string): Buffer {
  const name = sha256.digest(`global:${snakeCase(ixName)}`) as unknown as ArrayBuffer;
  return Buffer.from(name.slice(0, 8));
}

/**
 *
 * @param string
 */
const title = (string: string) =>
  string
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase()) // First char after each -/_
    .replace(/[A-Z]/g, ' $&') // Insert spaces before Capitals
    .replace(/  +/g, ' ') // remove double spaces
    .trim(); // trim leading trailing spaces

/**
 *
 * @param field
 */
const typeToString = (field) =>
  typeof field.type === 'string'
    ? field.type
    : 'vec' in field.type
      ? `Vec<${field.type.vec}>`
      : 'array' in field.type
        ? `${JSON.stringify(field.type.array)}`
        : field.toString();

/**
 *
 */
const sizes = {
  u8: 1,
  bool: 1,
  u16: 2,
  u64: 8,
  i64: 16,
  u128: 16,
  publicKey: 32,
  '["u8",32]': 32,
  'Vec<publicKey>': 314 * 32,
};

const addresses = {
  nosana_jobs: 'nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM',
  nosana_staking: 'nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE',
  nosana_rewards: 'nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp',
  nosana_pools: 'nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD',
  nosana_nodes: 'nosNeZR64wiEhQc5j251bsP4WqDabT6hmz4PHyoHLGD',
};

const descriptions = (name) => {
  switch (name) {
    // programs
    case 'tokenProgram':
      return 'The official SPL Token Program address. Responsible for token CPIs.';
    case 'systemProgram':
      return 'The official Solana system program address. Responsible for system CPIs.';
    case 'rewardsProgram':
      return 'The [Nosana Rewards](/programs/rewards) Program address.';

    // official
    case 'authority':
      return 'The signing authority of the program invocation.';
    case 'newAuthority':
      return 'The new authority of the  [SettingsAccount](#settings-account).';
    case 'rent':
      return 'The official Solana rent address. Responsible for lamports.';
    case 'mint':
      return 'The token Mint address for this instruction.';

    // token accounts
    case 'vault':
      return 'The [VaultAccount](#vault-account) address.';
    case 'vaultBump':
      return 'The bump for the [VaultAccount](#vault-account).';
    case 'beneficiary':
      return 'The token account that will receive the emissions from the Pool.';
    case 'newBeneficiary':
      return 'The token account that will become the new beneficiary.';
    case 'user':
      return 'The user token account that will debit/credit the tokens.';
    case 'tokenAccount':
      return 'The token account where slash deposits will go.';
    case 'nft':
      return 'The Token Account address that holds the NFT.';

    // custom accounts
    case 'settings':
      return 'The [SettingsAccount](#settings-account) address.';
    case 'market':
      return 'The [MarketAccount](#market-account) address.';
    case 'job':
      return 'The [JobAccount](#job-account) address.';
    case 'run':
      return 'The [RunAccount](#run-account) address.';
    case 'metadata':
      return 'The Metaplex Metadata address, that belongs to the NFT.';
    case 'pool':
      return 'The [PoolAccount](#pool-account) address.';
    case 'stake':
      return 'The [StakeAccount](/programs/staking#stake-account) address.';
    case 'reward':
      return 'The [RewardAccount](#reward-account) address.';
    case 'rewardsVault':
      return "The Nosana Rewards Program's [VaultAccount](/programs/rewards#vault-account) address.";
    case 'rewardsReflection':
      return "The Nosana Rewards Program's [ReflectionAccount](/programs/rewards#reflection-account) address.";
    case 'reflection':
      return 'The [ReflectionAccount](#reflection-account) address.';
    case 'accessKey':
      return 'The Node Access Key address.';

    // stake arguments
    case 'amount':
      return 'The number of tokens.';
    case 'duration':
      return 'The duration of the stake.';

    // pool arguments
    case 'emission':
      return 'The emission rate for the pool, per second.';
    case 'startTime':
      return 'The unix time the pool opens.';
    case 'claimType':
      return 'The [ClaimType](#claim-type) for this pool.';
    case 'closeable':
      return 'Whether the pool should be closable or not.';
    case 'claimedTokens':
      return 'The number of tokens that have been claimed.';

    // rewards arguments
    case 'rate':
      return 'The current reward rate.';
    case 'totalReflection':
      return 'The current total reflection.';
    case 'totalXnos':
      return 'The current total xNOS.';

    // job arguments
    case 'jobExpiration':
      return 'The expiration time in seconds for jobs.';
    case 'node':
      return 'The node that runs this job.';
    case 'project':
      return 'The project that listed this job.';
    case 'price':
      return 'The price in [$NOS](/tokens/token).';
    case 'status':
      return 'The job status (queued / running / done).';
    case 'timeStart':
      return 'The unix time this job has started running.';
    case 'timeEnd':
      return 'The unix time this job has finished running.';
    case 'jobTimeout':
      return 'The timeout time in seconds for jobs.';
    case 'timeout':
      return 'The timeout time in seconds for a job.';
    case 'jobType':
      return 'The [JobType](#job-type) number.';
    case 'jobPrice':
      return 'The price for jobs in this market.';
    case 'nodeStakeMinimum':
    case 'nodeXnosMinimum':
      return 'The amount of [`xNOS`](/programs/staking) a node needs to qualify for a market.';
    case 'nodeAccessKey':
      return 'The NFT collection address of an NFT that the node holds, in order to access this market.';
    case 'ipfsResult':
      return 'The byte array representing the IPFS hash to the results.';
    case 'ipfsJob':
      return 'The byte array representing the IPFS hash to the job.';
    case 'payer':
      return 'The paying identy for the rent.';
    case 'seed':
      return 'A new pubkey, or the system program pubkey';
    case 'queue':
      return 'The queue of order in the market.';
    case 'queueType':
      return 'The [QueueType](#queue-type) of the queue. Either Nodes or Jobs.';

    // nodes arguments
    case 'architectureType':
      return 'The [ArchitectureType](#architecture-type) of the node.';
    case 'countryCode':
      return 'The [CountryCode](#country-code) of the node.';
    case 'location':
      return 'The [CountryCode](#country-code) of the node.';
    case 'cpu':
      return 'The number of vCPU cores a node has.';
    case 'gpu':
      return 'The number of GPU cores a node has.';
    case 'memory':
      return 'Memory capacity of a node in GB.';
    case 'iops':
      return 'Input/output operations per second of a node.';
    case 'storage':
      return 'Storage capacity of a node in GB.';
    case 'endpoint':
      return 'HTTP endpoint for log streaming and results.';
    case 'version':
      return 'The version of the nosana node software they are running.';

    // default
    default:
      return 'n/a';
  }
};

/**
 *
 */
class MarkdownTable {
  private padding: Array<number>;

  constructor(padding: Array<number> = [40, 40]) {
    this.padding = padding;
  }

  row(values: Array<string>) {
    const row = [];
    for (let i = 0; i < this.padding.length; i++) {
      row.push(`| ${values[i]}`.padEnd(this.padding[i]));
    }
    row.push('|');
    return row.join('');
  }

  sep() {
    const row = [];
    for (let i = 0; i < this.padding.length; i++) {
      row.push('|'.padEnd(this.padding[i], '-'));
    }
    row.push('|');
    return row.join('');
  }
}

/**
 *
 */
function main() {
  for (const idl of [NosanaPools, NosanaJobs, NosanaRewards, NosanaStaking, NosanaNodes]) {
    console.log(`Generating docs for ${title(idl.name)}`);
    const address = addresses[idl.name];

    // we're going to load all documentatation into this data array
    const data = [];

    /**
     * PROGRAM INFORMATION
     */
    const pt = new MarkdownTable([18, 134]);
    data.push(
      '## Program Information',
      '',
      pt.row(['Info', 'Description']),
      pt.sep(),
      pt.row(['Type', `[Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)`]),
      pt.row(['Source Code', `[GitHub](https://github.com/nosana-ci/nosana-programs)`]),
      pt.row(['Build Status', `[Anchor Verified](https://www.apr.dev/program/${address})`]),
      pt.row(['Accounts', `[\`${idl.accounts.length + 1}\`](#accounts)`]),
      pt.row(['Instructions', `[\`${idl.instructions.length}\`](#instructions)`]),
      pt.row(['Types', `[\`${'types' in idl ? idl.types.length : 0}\`](#types)`]),
      pt.row(['Errors', `[\`${'errors' in idl ? idl.errors.length : 0}\`](#errors)`]),
      pt.row(['Domain', `\`nosana-${idl.name.split('_')[1]}.sol\``]),
      pt.row([' Address', `[\`${address}\`](https://explorer.solana.com/address/${address})`]),
      '',
    );

    /**
     * INSTRUCTIONS
     */
    data.push(
      '## Instructions',
      '',
      `A number of ${idl.instructions.length} instruction are defined in the ${title(idl.name)} program.`,
      '',
    );
    data.push(
      'To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).',
      '',
      '```typescript',
      `const programId = new PublicKey('${address}');`,
      'const idl = await Program.fetchIdl(programId.toString());',
      'const program = new Program(idl, programId);',
      '```',
      '',
    );

    if (options.enhance) data.push(':::: tabs');
    for (const instruction of idl.instructions) {
      if (options.enhance) data.push(`@tab ${title(instruction.name)}`);

      // docs from idl
      data.push(`### ${title(instruction.name)}`, '');
      if ('docs' in instruction) data.push(...instruction['docs'], '');

      // accounts table
      // data.push(options.enhance? '::: details Accounts' : undefined)
      const at = new MarkdownTable([25, 90, 100]);
      data.push(
        '#### Account Info',
        '',
        `The following ${instruction.accounts.length} account addresses should be provided when invoking this instruction.`,
        '',
        at.row(['Name', 'Type', 'Description']),
        at.sep(),
      );
      const signers = [];
      for (const account of instruction.accounts) {
        data.push(
          at.row([
            `\`${account.name}\``,
            `<FontIcon icon="pencil" color="${account.isMut ? '#3EAF7C' : 'lightgrey'}" />` +
              `<FontIcon icon="key" color="${account.isSigner ? '#3EAF7C' : 'lightgrey'}" />`,
            `${descriptions(account.name)}`,
          ]),
        );
        // add signer
        if (account.isSigner) signers.push(`${account.name}Key`);
      }
      data.push('');
      // data.push(options.enhance? ':::' : undefined) // accounts

      if (instruction.args.length !== 0) {
        // args table
        // data.push(options.enhance? '::: details Arguments' : undefined)
        const ft = new MarkdownTable([25, 20, 10, 10, 60]);
        data.push(
          '#### Arguments',
          '',
          `The following ${instruction.args.length} arguments should also be provided when invoking this instruction.`,
          '',
          ft.row(['Name', 'Type', 'Size', 'Offset', 'Description']),
          ft.sep(),
        );
        let offset = 0;
        for (const arg of instruction.args) {
          const size = sizes[typeToString(arg)];
          data.push(
            ft.row([
              `\`${arg.name}\``,
              `\`${typeToString(arg)}\``,
              `\`${size}\``,
              `\`${offset}\``,
              `${descriptions(arg.name)}`,
            ]),
          );
          offset += size;
        }
        data.push('');
        // data.push(options.enhance? ':::' : undefined) // accounts
      }

      const dispatch = dispatchId(instruction.name);
      data.push(
        '',
        `${options.enhance ? '::: details' : '####'} Solana Dispatch ID`,
        '',
        `The Solana dispatch ID for the ${title(instruction.name)} Instruction`,
        `is **\`${dispatch.toString('hex')}\`**,`,
        'which can also be expressed as an 8 byte discriminator:',
        '',
        '```json',
        `${'[' + [...dispatch] + ']'}`,
        '```',
        '',
      );
      if (options.enhance) data.push(':::');

      data.push(`${options.enhance ? '::: details' : '####'} Example with Anchor`);
      data.push(
        '',
        `To invoke the ${title(instruction.name)} Instruction`,
        'with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).',
        '',
      );

      // code list
      const code = [];
      code.push('```typescript', 'let tx = await program.methods');

      // args
      const commentPadding = 23;
      if (instruction.args.length === 0) {
        code.push(`  .${instruction.name}()`);
      } else {
        code.push(`  .${instruction.name}(`);
        for (const arg of instruction.args) {
          code.push(`    ${arg.name},`.padEnd(commentPadding) + `// type: ${typeToString(arg)}`);
        }
        code.push(`  )`);
      }

      // accounts
      code.push('  .accounts({');
      for (const account of instruction.accounts) {
        code.push(
          `    ${account.name},`.padEnd(commentPadding) +
            `// ${(account.isMut ? '✓' : '𐄂') + ' writable, ' + (account.isSigner ? '✓' : '𐄂') + ' signer'}`,
        );
      }
      code.push('  })');

      // signers
      if (signers.length > 0) code.push(`  .signers([${signers.join(', ')}])`);

      // rpc
      code.push('  .rpc();', '```', '');

      if (false) {
        data.push('::: code-tabs#lang');
        for (const lang of ['JavaScript', 'TypeScript']) {
          data.push(`@tab ${lang}`);
          code[0] = `\`\`\`${lang.toLowerCase()}`;
          data.push(...code);
        }
        data.push(':::');
      } else {
        data.push(...code);
      }
    }

    if (options.enhance) data.push(':::', '::::'); // details, tab

    /**
     * ACCOUNTS
     */
    data.push(
      '## Accounts',
      '',
      `A number of ${idl.accounts.length + 1} accounts make up for the ${title(idl.name)} Program's state.`,
      options.enhance ? '\n:::: tabs\n' : '',
    );

    for (const account of idl.accounts) {
      if (options.enhance) data.push(`@tab ${title(account.name)}`);

      // title
      data.push(`### ${title(account.name)}`, '');
      if ('docs' in account) data.push(...account['docs']);

      let size = 8;
      for (const field of account.type.fields) size += sizes[typeToString(field)];
      data.push(`The total size of this account is \`${size.toLocaleString('en')}\` bytes.`, '');

      // accounts table
      const at = new MarkdownTable([30, 30, 10, 10, 100]);
      data.push(at.row(['Name', 'Type', 'Size', 'Offset', 'Description']), at.sep());
      let offset = 8;
      for (const field of account.type.fields) {
        const size = sizes[typeToString(field)];
        data.push(
          at.row([
            `\`${field.name}\``,
            `\`${typeToString(field)}\``,
            `\`${size}\``,
            `\`${offset}\``,
            `${descriptions(field.name)}`,
          ]),
        );
        offset += size;
      }
      const discriminator = BorshAccountsCoder.accountDiscriminator(account.name);
      data.push(
        '',
        `${options.enhance ? '::: details' : '####'} Anchor Account Discriminator`,
        '',
        `The first 8 bytes, also known as Anchor's 8 byte discriminator, for the ${title(account.name)}`,
        `are **\`${discriminator.toString('hex')}\`**, which can also be expressed in byte array:`,
        '',
        '```json',
        `${'[' + [...discriminator] + ']'}`,
        '```',
        '',
      );
    }
    if (options.enhance) data.push(':::', '');

    // the vault account
    if (options.enhance) data.push('@tab Vault Account');
    data.push('### Vault Account', '', 'The `VaultAccount` is a regular Solana Token Account.', '');
    if (options.enhance) data.push('::::', '');

    /**
     * TYPES
     */
    if ('types' in idl) {
      data.push(
        '## Types',
        '',
        `A number of ${idl.types.length} type variants are defined in the ${title(idl.name)} Program's state.`,
        '',
      );

      if (options.enhance) data.push('::: tabs');

      for (const t of idl.types) {
        if (options.enhance) data.push(`@tab ${title(t.name)}`);

        data.push(`### ${title(t.name)}`, '\n');
        if ('docs' in t) data.push(...t['docs'], '');

        // types table
        const tt = new MarkdownTable();
        if (t.type.kind === 'enum') {
          data.push(`A number of ${t.type.variants.length} variants are defined in this \`enum\`:`);
          data.push(tt.row(['Name', 'Number']), tt.sep());
          for (const field of t.type.variants) {
            data.push(
              tt.row([`\`${field.name}\``, `\`${field.name === 'Unknown' ? 255 : t.type.variants.indexOf(field)}\``]),
            );
          }
        } else {
          throw 'woops';
        }

        data.push('');
      }

      if (options.enhance) data.push(':::', '');
    }

    /**
     * ERRORS
     */
    if ('errors' in idl) {
      data.push(
        '## Errors',
        '',
        `A number of ${idl.errors.length} errors are defined in the ${title(idl.name)} Program.`,
        options.enhance ? '\n:::: tabs\n' : '',
      );

      for (const error of idl.errors) {
        if (options.enhance) data.push(`@tab ${error.code}`, '', `::: warning Nosana Error`, '');

        data.push(`### \`${error.code}\` - ${title(error.name)}`, '', `${error.msg}`, '');

        if (options.enhance) data.push(':::', '');
      }
      if (options.enhance) data.push('::::', '');
    }

    /**
     * DIAGRAMS
     */
    if (options.diagrams) {
      const file = `./docs/diagrams/${idl.name.split('_')[1]}.md`;
      if (existsSync(file)) {
        const doc = readFileSync(file).toString().split('\n');
        data.push(...doc);
      }
    }

    /**
     * WRITE RESULTS
     */
    if ('output-dir' in options) {
      const file = `${options['output-dir']}/${idl.name.split('_')[1]}.md`;
      console.log(`   => ..reading from file ${file}`);
      const doc = readFileSync(file).toString().split('\n');

      const begin = doc.indexOf('<!-- BEGIN_NOS_DOCS -->');
      const end = doc.indexOf('<!-- END_NOS_DOCS -->');

      if (begin === -1 || end === -1) throw 'Could not find document insertion points.';

      doc.splice(begin + 2, end - begin - 2, ...data);

      writeFileSync(file, doc.join('\n'), { flag: 'w' });
      console.log(`   => ..done writing to file ${file}`);
    } else {
      const file = `./docs/${idl.name.split('_')[1]}.md`;
      console.log(`    => writing to file ${file}!`);
      data.splice(0, 0, `# ${title(idl.name)}`, '');
      writeFileSync(file, data.join('\n'), { flag: 'w' });
    }
  }
}

console.log('Running doc writer.');
main();
console.log('Success');

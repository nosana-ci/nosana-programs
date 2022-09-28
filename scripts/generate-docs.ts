// @ts-ignore
import nosanaJobs from '../target/idl/nosana_jobs.json';
// @ts-ignore
import nosanaPools from '../target/idl/nosana_pools.json';
// @ts-ignore
import nosanaRewards from '../target/idl/nosana_rewards.json';
// @ts-ignore
import nosanaStaking from '../target/idl/nosana_staking.json';
import { writeFileSync, readFileSync } from 'fs';
import commandLineArgs from 'command-line-args';

const options = commandLineArgs([
  { name: 'enhance', alias: 'e', type: Boolean },
  { name: 'output-dir', alias: 'o', type: String },
]);

const commentPadding = 23;

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
    ? `[${field.type.array[0]}; ${field.type.array[1]}]`
    : field.toString();

/**
 *
 */
const sizes = {
  u8: 1,
  bool: 1,
  u64: 8,
  i64: 16,
  u128: 16,
  publicKey: 32,
  '[u8; 32]': 32,
  'Vec<publicKey>': 100*32,
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
  for (const idl of [nosanaPools, nosanaJobs, nosanaRewards, nosanaStaking]) {
    console.log(`Generating docs for ${title(idl.name)}`);

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
      pt.row(['Build Status', `[Anchor Verified](https://www.apr.dev/program/${idl.metadata.address})`]),
      pt.row(['Accounts', `[\`${idl.accounts.length + 1}\`](#accounts)`]),
      pt.row(['Instructions', `[\`${idl.instructions.length}\`](#instructions)`]),
      pt.row(['Types', `[\`${'types' in idl ? idl.types.length : 0}\`](#types)`]),
      pt.row(['Domain', `\`nosana-${idl.name.split('_')[1]}.sol\``]),
      pt.row([
        ' Address',
        `[\`${idl.metadata.address}\`](https://explorer.solana.com/address/${idl.metadata.address})`,
      ]),
      ''
    );

    /**
     * INSTRUCTIONS
     */
    data.push(
      '## Instructions',
      '',
      `A number of ${idl.instructions.length} instruction are defined in the ${title(idl.name)} program.`,
      'To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)',
      '',
      '```typescript',
      `const programId = new PublicKey('${idl.metadata.address}');`,
      'const idl = await Program.fetchIdl(programId.toString());',
      'const program = new Program(idl, programId);',
      '```',
      ''
    );

    data.push(options.enhance ? ':::: tabs' : undefined);

    for (const instruction of idl.instructions) {
      data.push(options.enhance ? `@tab ${title(instruction.name)}` : undefined);

      // docs from idl
      try {
        data.push(...instruction['docs']);
      } catch (e) {
        data.push(`### ${title(instruction.name)}`, '\n');
      }

      // accounts table
      // data.push(options.enhance? '::: details Accounts' : undefined)
      const at = new MarkdownTable([20, 90, 30]);
      data.push('#### Accounts', '', at.row(['Name', 'Type', 'Description']), at.sep());
      for (const account of instruction.accounts) {
        data.push(
          at.row([
            `\`${account.name}\``,
            `<FontIcon icon="pencil" color="${account.isMut ? '#3EAF7C' : 'lightgrey'}" /><FontIcon icon="key" color="${
              account.isSigner ? '#3EAF7C' : 'lightgrey'
            }" />`,
            `The ${title(account.name)} Account`,
          ])
        );
      }
      data.push('');
      // data.push(options.enhance? ':::' : undefined) // accounts

      if (instruction.args.length !== 0) {
        // args table
        // data.push(options.enhance? '::: details Arguments' : undefined)
        const ft = new MarkdownTable([25, 10, 10, 60]);
        data.push('#### Arguments', '', ft.row(['Name', 'Size', 'Offset', 'Description']), ft.sep());
        let offset = 0;
        for (const arg of instruction.args) {
          const size = sizes[typeToString(arg)];
          data.push(ft.row([`\`${arg.name}\``, `\`${size}\``, `\`${offset}\``, `The ${title(arg.name)} argument`]));
          offset += size;
        }
        data.push('');
        // data.push(options.enhance? ':::' : undefined) // accounts
      }

      data.push(options.enhance ? '::: details Example' : '#### Example');
      // example
      data.push('', 'To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).', '');

      const code = [];
      code.push('```typescript', 'let tx = await program.methods');

      if (instruction.args.length === 0) {
        code.push(`  .${instruction.name}()`);
      } else {
        code.push(`  .${instruction.name}(`);
        for (const arg of instruction.args) {
          code.push(`    ${arg.name},`.padEnd(commentPadding) + `// type: ${typeToString(arg)}`);
        }
        code.push(`  )`);
      }

      code.push('  .accounts({');
      for (const account of instruction.accounts) {
        code.push(
          `    ${account.name},`.padEnd(commentPadding) +
            `// ${(account.isMut ? '✓' : '𐄂') + ' writable, ' + (account.isSigner ? '✓' : '𐄂') + ' signer'}`
        );
      }
      code.push('  })', '  .rpc();', '```', '');

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
    data.push(options.enhance ? ':::' : undefined); // details
    data.push(options.enhance ? ':::: ' : undefined); // tab

    /**
     * ACCOUNTS
     */
    data.push(
      '## Accounts',
      '',
      `A number of ${idl.accounts.length + 1} accounts make up for the ${title(idl.name)} Program's state.`,
      '',
      options.enhance ? '::: tabs' : undefined,
      options.enhance ? '@tab Vault Account' : undefined,
      '',
      '### Vault Account',
      '',
      'The `VaultAccount` is a regular Solana Token Account.',
      ''
    );

    for (const account of idl.accounts) {
      data.push(options.enhance ? `@tab ${title(account.name)}` : undefined);

      // title
      try {
        data.push(...account['docs']);
      } catch (e) {
        data.push(`### ${title(account.name)}`, '\n');
      }

      // accounts table
      const at = new MarkdownTable([30, 30, 10, 10]);
      data.push(at.row(['Name', 'Type', 'Size', 'Offset']), at.sep());
      let offset = 8;
      for (const field of account.type.fields) {
        const size = sizes[typeToString(field)];
        data.push(at.row([`\`${field.name}\``, `\`${typeToString(field)}\``, `\`${size}\``, `\`${offset}\``]));
        offset += size;
      }
    }

    data.push(options.enhance ? ':::' : '');

    /**
     * TYPES
     */
    if ('types' in idl) {
      data.push(
        '## Types',
        '',
        `A number of ${idl.types.length} type variants are defined in the ${title(idl.name)} Program's state.`,
        ''
      );

      data.push(options.enhance ? '::: tabs' : undefined);

      for (const t of idl.types) {
        data.push(options.enhance ? `@tab ${title(t.name)}` : undefined);

        try {
          data.push(...t['docs']);
        } catch (e) {
          data.push(`### ${title(t.name)}`, '\n');
        }

        // types table
        data.push(`A number of ${t.type.variants.length} variants are defined:`);
        const tt = new MarkdownTable();
        data.push(tt.row(['Name', 'Number']), tt.sep());
        for (const field of t.type.variants) {
          data.push(
            tt.row([`\`${field.name}\``, `\`${field.name === 'Unknown' ? 255 : t.type.variants.indexOf(field)}\``])
          );
        }
      }

      data.push(options.enhance ? ':::' : '');
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

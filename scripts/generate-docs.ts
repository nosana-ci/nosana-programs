// @ts-ignore
import nosanaJobs from '../target/idl/nosana_jobs.json';
// @ts-ignore
import nosanaPools from '../target/idl/nosana_pools.json';
// @ts-ignore
import nosanaRewards from '../target/idl/nosana_rewards.json';
// @ts-ignore
import nosanaStaking from '../target/idl/nosana_staking.json';
import { writeFileSync, readFileSync } from 'fs';

const commentPadding = 23;

/**
 *
 * @param string
 */
const title = (string) =>
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
class MarkdownTable {
  private left: number;
  private right: number;

  constructor(left: number, right: number) {
    this.left = left;
    this.right = right;
  }

  row(left: string, right: string) {
    return `| ${left}`.padEnd(this.left) + `| ${right}`.padEnd(this.right) + '|';
  }

  sep() {
    return `|`.padEnd(this.left, '-') + `|`.padEnd(this.right, '-') + '|';
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
     * INSTRUCTIONS
     */
    const pt = new MarkdownTable(18, 134);
    data.push(
      '## Program Information',
      '',
      pt.row('Info', 'Description'),
      pt.sep(),
      pt.row('Type', `[⚙️ Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)`),
      pt.row('Source Code', `[👨‍💻GitHub](https://github.com/nosana-ci/nosana-programs)`),
      pt.row('Build Status', `[✅ Anchor Verified](https://www.apr.dev/program/${idl.metadata.address})`),
      pt.row('Accounts', `[\`${idl.accounts.length + 1}\` account types](#accounts)`),
      pt.row('Instructions', `[\`${idl.instructions.length}\` instructions](#instructions)`),
      pt.row('Domain', `🌐 \`nosana-${idl.name.split('_')[1]}.sol\``),
      pt.row(
        'Program Address',
        `[🧭 \`${idl.metadata.address}\`](https://explorer.solana.com/address/${idl.metadata.address})`
      ),
      '',
      '## Instructions',
      '',
      `A number of ${idl.instructions.length} instruction are defined in the ${title(idl.name)} program.`,
      'To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html) in `TypeScript`:',
      '',
      '```typescript',
      `const programId = new PublicKey('${idl.metadata.address}');`,
      'const idl = await Program.fetchIdl(programId.toString());',
      'const program = new Program(idl, programId);',
      '```',
      ''
    );

    for (const instruction of idl.instructions) {
      // title
      try {
        data.push(...instruction['docs']);
      } catch (e) {
        data.push(`### ${title(instruction.name)}`, '\n');
      }

      // example
      data.push('```typescript', 'let tx = await program.methods');
      if (instruction.args.length === 0) {
        data.push(`  .${instruction.name}()`);
      } else {
        data.push(`  .${instruction.name}(`);
        for (const arg of instruction.args) {
          data.push(`    ${arg.name}`.padEnd(commentPadding) + `// type: ${typeToString(arg)}`);
        }
        data.push(`  )`);
      }

      data.push('  .accounts({');
      for (const account of instruction.accounts) {
        data.push(
          `    ${account.name},`.padEnd(commentPadding) +
            `// ${(account.isMut ? '✓' : '𐄂') + ' writable, ' + (account.isSigner ? '✓' : '𐄂') + ' signer'}`
        );
      }
      data.push('  })', '  .rpc();', '```', '');
    }

    /**
     * ACCOUNTS
     */
    data.push(
      '## Accounts',
      '',
      `A number of ${idl.accounts.length + 1} accounts make up for the ${title(idl.name)} Program's state.`,
      '',
      '### Vault Account',
      '',
      'The `VaultAccount` is a regular Solana Token Account.',
      ''
    );

    for (const account of idl.accounts) {
      // title
      try {
        data.push(...account['docs']);
      } catch (e) {
        data.push(`### ${title(account.name)}`, '\n');
      }

      // accounts table
      const at = new MarkdownTable(40, 40);
      data.push(at.row('Name', 'Type'), at.sep());
      for (const field of account.type.fields) {
        data.push(at.row(`\`${field.name}\``, `\`${typeToString(field)}\``));
      }
      data.push('');
    }

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

      for (const t of idl.types) {
        // title
        try {
          data.push(...t['docs']);
        } catch (e) {
          data.push(`### ${title(t.name)}`, '\n');
        }

        // types table
        data.push(`A number of ${t.type.variants.length} variants are defined:`);
        const tt = new MarkdownTable(40, 40);
        data.push(tt.row('Name', 'byte'), tt.sep());
        for (const field of t.type.variants) {
          data.push(
            tt.row(`\`${field.name}\``, `\`${field.name === 'Unknown' ? 255 : t.type.variants.indexOf(field)}\``)
          );
        }
        data.push('');
      }
    }

    // write result
    if (process.argv.slice(2)[0]) {
      const file = `${process.argv.slice(2)[0]}/${idl.name.split('_')[1]}.md`;
      console.log(`   => ..reading from file ${file}`);
      const doc = readFileSync(file).toString().split('\n');

      const begin = doc.indexOf('<!-- BEGIN_NOS_DOCS -->');
      const end = doc.indexOf('<!-- END_NOS_DOCS -->');

      if (begin === -1 || end === -1) throw 'Could not find document insertion points.';

      doc.splice(begin + 2, end - begin - 2, ...data);

      writeFileSync(file, doc.join('\n'), { flag: 'w' });
      console.log(`   => ..done writing to file ${file}`);
    } else {
      const file = `./docs/${idl.name}.md`;
      console.log(`    => writing to file ${file}!`);
      data.splice(0, 0, `# ${title(idl.name)}`, '');
      writeFileSync(file, data.join('\n'), { flag: 'w' });
    }
  }
}

console.log('Running doc writer.');
main();
console.log('Success');

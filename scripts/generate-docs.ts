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
 * @param s
 */
const title = (s) =>
  s
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
function main() {
  for (const idl of [nosanaPools, nosanaJobs, nosanaRewards, nosanaStaking]) {
    console.log(`Generating docs for ${title(idl.name)}`);

    // we're going to load all documentatation into this data array
    const data = [];

    /**
     * INSTRUCTIONS
     */
    const pLeft = 18;
    const pRight = 134;
    data.push(
      '## Program Information',
      '',
      '| Info'.padEnd(pLeft) + '| Description'.padEnd(pRight) + '|',
      '|'.padEnd(pLeft, '-') + '|'.padEnd(pRight, '-') + '|',
      '| Type'.padEnd(pLeft) +
        `| [⚙️ Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)`.padEnd(pRight) +
        '|',
      '| Source Code'.padEnd(pLeft) + `| [👨‍💻GitHub](https://github.com/nosana-ci/nosana-programs)`.padEnd(pRight) + '|',
      '| Build Status'.padEnd(pLeft) +
        `| [✅ Anchor Verified](https://www.apr.dev/program/${idl.metadata.address})`.padEnd(pRight) +
        '|',
      '| Program Address'.padEnd(pLeft) +
        `| [🧭 \`${idl.metadata.address}\`](https://explorer.solana.com/address/${idl.metadata.address})`.padEnd(
          pRight
        ) +
        '|',
      '| Accounts'.padEnd(pLeft) + `| [\`${idl.accounts.length + 1}\` account types](#accounts)`.padEnd(pRight) + '|',
      '| Instructions'.padEnd(pLeft) +
        `| [\`${idl.instructions.length + 1}\` instructions](#instructions)`.padEnd(pRight) +
        '|',
      '| Domain'.padEnd(pLeft) + `| 🌐 \`nosana-${idl.name.split('_')[1]}.sol\``.padEnd(pRight) + '|',
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

      // table
      const padding = 40;
      data.push(
        '| Name'.padEnd(padding) + '| Type'.padEnd(padding) + '|',
        '|'.padEnd(padding, '-') + '|'.padEnd(padding, '-') + '|'
      );
      for (const field of account.type.fields) {
        data.push(`| \`${field.name}\``.padEnd(padding) + `| \`${typeToString(field)}\``.padEnd(padding) + `|`);
      }
      data.push('');
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

// @ts-ignore
import nosanaJobs from '../target/idl/nosana_jobs.json';
// @ts-ignore
import nosanaPools from '../target/idl/nosana_pools.json';
// @ts-ignore
import nosanaRewards from '../target/idl/nosana_rewards.json';
// @ts-ignore
import nosanaStaking from '../target/idl/nosana_staking.json';
import { writeFileSync, readFileSync } from 'fs';

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
 */
function main() {
  for (const idl of [nosanaPools, nosanaJobs, nosanaRewards, nosanaStaking]) {
    const data = [];

    /**
     * INSTRUCTIONS
     */
    data.push(
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
      data.push('```typescript', 'let tx = await program.methods', `  .${instruction.name}()`, '  .accounts({');
      for (const account of instruction.accounts) {
        data.push(
          `    ${account.name}, // ${
            (account.isMut ? '✓' : '𐄂') + ' writable, ' + (account.isSigner ? '✓' : '𐄂') + ' signer'
          }`
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
      `A number of ${idl.accounts.length} accounts make up for the ${title(idl.name)} Program's state.`,
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
      data.push('| Name | Type |', '| ---- | ---- |');
      for (const field of account.type.fields) {
        data.push(`| \`${field.name}\` | \`${field.type}\` |`);
      }
      data.push('');
    }

    // write result
    if (process.argv.slice(2)[0]) {
      const file = `${process.argv.slice(2)[0]}/${idl.name.split('_')[1]}.md`;
      console.log(`Reading from file to file ${file}`);
      const doc = readFileSync(file).toString().split('\n');

      const begin = doc.indexOf('<!-- BEGIN_NOS_DOCS -->');
      const end = doc.indexOf('<!-- END_NOS_DOCS -->');

      if (begin === -1 || end === -1) throw 'Could not find document insertion points.';

      doc.splice(begin + 2, end - begin - 2, ...data);

      writeFileSync(file, doc.join('\n'), { flag: 'w' });
    } else {
      const file = `./docs/${idl.name}.md`;
      console.log(`Writing to file ${file}`);
      data.splice(0, 0, `# ${title(idl.name)}`, '');
      writeFileSync(file, data.join('\n'), { flag: 'w' });
    }
  }
}

console.log('Running doc writer.');
main();
console.log('Success');

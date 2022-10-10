# Nosana Jobs

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM)                                          |
| Accounts        | [`3`](#accounts)                                                                                                                    |
| Instructions    | [`11`](#instructions)                                                                                                               |
| Types           | [`4`](#types)                                                                                                                       |
| Domain          | `nosana-jobs.sol`                                                                                                                   |
|  Address        | [`nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM`](https://explorer.solana.com/address/nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM)    |

## Instructions

A number of 11 instruction are defined in the Nosana Jobs program.

To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

### Open

The `open()` instruction initializes a [MarketAccount](#market-account) and an
associated [VaultAccount](#vault-account) for token deposits.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `mint`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The token Mint address for this instruction.                                                      |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [JobAccount](#job-account) address.                                                           |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `accessKey`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Node Access Key address.                                                                      |
| `rent`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana rent address. Responsible for lamports.                                       |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `jobExpiration`        | `i64`             | `16`    | `0`     | The expiration time in seconds for jobs.                  |
| `jobPrice`             | `u64`             | `8`     | `16`    | The price for jobs in this market.                        |
| `jobTimeout`           | `i64`             | `16`    | `24`    | The timeout time in seconds for jobs.                     |
| `jobType`              | `u8`              | `1`     | `40`    | The [JobType](#job-type) number.                          |
| `nodeXnosMinimum`      | `u64`             | `8`     | `41`    | n/a                                                       |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .open(
    jobExpiration,     // type: i64
    jobPrice,          // type: u64
    jobTimeout,        // type: i64
    jobType,           // type: u8
    nodeXnosMinimum,   // type: u64
  )
  .accounts({
    mint,              // 𐄂 writable, 𐄂 signer
    market,            // ✓ writable, ✓ signer
    vault,             // ✓ writable, 𐄂 signer
    job,               // ✓ writable, ✓ signer
    authority,         // ✓ writable, ✓ signer
    accessKey,         // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([marketKey, jobKey, authorityKey])
  .rpc();
```

### Update

The `update()` instruction updates a [MarketAccount](#market-account) configurations.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `accessKey`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Node Access Key address.                                                                      |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Arguments

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `jobExpiration`        | `i64`             | `16`    | `0`     | The expiration time in seconds for jobs.                  |
| `jobPrice`             | `u64`             | `8`     | `16`    | The price for jobs in this market.                        |
| `jobTimeout`           | `i64`             | `16`    | `24`    | The timeout time in seconds for jobs.                     |
| `jobType`              | `u8`              | `1`     | `40`    | The [JobType](#job-type) number.                          |
| `nodeStakeMinimum`     | `u64`             | `8`     | `41`    | The number of tokens a node needs to stake to qualify.    |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .update(
    jobExpiration,     // type: i64
    jobPrice,          // type: u64
    jobTimeout,        // type: i64
    jobType,           // type: u8
    nodeStakeMinimum,  // type: u64
  )
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    accessKey,         // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

### Close

The `close()` instruction closes a [MarketAccount](#market-account) and the
associated [VaultAccount](#vault-account).
The vault has to be empty of tokens.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .close()
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### List

The `list()` instruction lists a job, with its required data.
When there is a node available, a [JobAccount](#job-account) will automatically be created.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `rewardsReflection`    | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [ReflectionAccount](/programs/rewards#reflection-account) address.   |
| `rewardsVault`         | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Nosana Rewards Program's [VaultAccount](/programs/rewards#vault-account) address.             |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `rewardsProgram`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [Nosana Rewards](/programs/rewards) Program address.                                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

#### Arguments

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `ipfsJob`              | `["u8",32]`       | `32`    | `0`     | The byte array representing the IPFS hash to the job.     |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .list(
    ipfsJob,           // type: ["u8",32]
  )
  .accounts({
    job,               // ✓ writable, ✓ signer
    market,            // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    rewardsReflection, // ✓ writable, 𐄂 signer
    rewardsVault,      // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    rewardsProgram,    // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([jobKey, payerKey, authorityKey])
  .rpc();
```

### Recover

The `recover()` instruction recovers funds from a jobs that has been [Quit](#quit)'ed.
The [JobAccount](#job-account) will automatically be created.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `payer`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The paying identy for the rent.                                                                   |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .recover()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    payer,             // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### Work

With the `work()` instruction a node enters the [MarketAccount](#market-account) queue.
When there is a job available, a [JobAccount](#job-account) will automatically be created.

A few requirements are enforced:

- A node needs to have a minimum stake in Nosana Staking.
- A node needs to hold an official Nosana NFT.
- A node can only enter the queue once

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `payer`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The paying identy for the rent.                                                                   |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `nft`                  | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Account address that holds the NFT.                                                     |
| `metadata`             | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Metaplex Metadata address, that belongs to the NFT.                                           |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .work()
  .accounts({
    job,               // ✓ writable, ✓ signer
    market,            // ✓ writable, 𐄂 signer
    payer,             // ✓ writable, ✓ signer
    stake,             // 𐄂 writable, 𐄂 signer
    nft,               // 𐄂 writable, 𐄂 signer
    metadata,          // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([jobKey, payerKey, authorityKey])
  .rpc();
```

### Stop

With the `stop()` instruction a node exits the node queue
from a [MarketAccount](#market-account).

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `market`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [MarketAccount](#market-account) address.                                                     |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .stop()
  .accounts({
    market,            // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

### Claim

With the `claim()` instruction a node claims a job that is [stopped](#stop).

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `nft`                  | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Account address that holds the NFT.                                                     |
| `metadata`             | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Metaplex Metadata address, that belongs to the NFT.                                           |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .claim()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    nft,               // 𐄂 writable, 𐄂 signer
    metadata,          // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

### Finish

With the `finish()` instruction a node can can post the result for a job it has finished,
and be reimbursed for the work.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `ipfsResult`           | `["u8",32]`       | `32`    | `0`     | The byte array representing the IPFS hash to the results. |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .finish(
    ipfsResult,        // type: ["u8",32]
  )
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### Quit

With the `quit()` instruction a node can quit a job that it has started.

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .quit()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

### Clean

The `clean()` instruction closes an [JobAccount](#job-account).
The job has be finished and the job expiration time has to be exceeded.

This [filter](https://solanacookbook.com/guides/get-program-accounts) finds finished jobs:

```json
{ "memcmp": { "offset": 208, "bytes": "2" } }
```

#### Account Info

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `job`                  | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [JobAccount](#job-account) address.                                                           |
| `market`               | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [MarketAccount](#market-account) address.                                                     |
| `payer`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The paying identy for the rent.                                                                   |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .clean()
  .accounts({
    job,               // ✓ writable, 𐄂 signer
    market,            // 𐄂 writable, 𐄂 signer
    payer,             // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

## Accounts

A number of 3 accounts make up for the Nosana Jobs Program's state.

### Market Account

The `MarketAccount` struct holds all the information about jobs and the nodes queue.

The total size of this account is `7,355` bytes.
| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `authority`                 | `publicKey`                 | `32`    | `8`     | The signing authority of the program invocation.                                                  |
| `jobExpiration`             | `i64`                       | `16`    | `40`    | The expiration time in seconds for jobs.                                                          |
| `jobPrice`                  | `u64`                       | `8`     | `56`    | The price for jobs in this market.                                                                |
| `jobTimeout`                | `i64`                       | `16`    | `64`    | The timeout time in seconds for jobs.                                                             |
| `jobType`                   | `u8`                        | `1`     | `80`    | The [JobType](#job-type) number.                                                                  |
| `vault`                     | `publicKey`                 | `32`    | `81`    | The [VaultAccount](#vault-account) address.                                                       |
| `vaultBump`                 | `u8`                        | `1`     | `113`   | The bump for the [VaultAccount](#vault-account).                                                  |
| `nodeAccessKey`             | `publicKey`                 | `32`    | `114`   | The NFT collection address of an NFT that the node holds, in order to access this market.         |
| `nodeXnosMinimum`           | `u64`                       | `8`     | `146`   | n/a                                                                                               |
| `queueType`                 | `u8`                        | `1`     | `154`   | The [QueueType](#queue-type) of the queue. Either Nodes or Jobs.                                  |
| `queue`                     | `Vec<Order>`                | `7200`  | `155`   | The queue of order in the market.                                                                 |

### Job Account

The `JobAccount` struct holds all the information about any individual jobs.

The total size of this account is `241` bytes.
| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `ipfsJob`                   | `["u8",32]`                 | `32`    | `8`     | The byte array representing the IPFS hash to the job.                                             |
| `ipfsResult`                | `["u8",32]`                 | `32`    | `40`    | The byte array representing the IPFS hash to the results.                                         |
| `market`                    | `publicKey`                 | `32`    | `72`    | The [MarketAccount](#market-account) address.                                                     |
| `node`                      | `publicKey`                 | `32`    | `104`   | The node that runs this job.                                                                      |
| `payer`                     | `publicKey`                 | `32`    | `136`   | The paying identy for the rent.                                                                   |
| `price`                     | `u64`                       | `8`     | `168`   | The price in [$NOS](/tokens/token).                                                               |
| `project`                   | `publicKey`                 | `32`    | `176`   | The project that listed this job.                                                                 |
| `status`                    | `u8`                        | `1`     | `208`   | The job status (queued / running / done).                                                         |
| `timeEnd`                   | `i64`                       | `16`    | `209`   | The unix time this job has finished running.                                                      |
| `timeStart`                 | `i64`                       | `16`    | `225`   | The unix time this job has started running.                                                       |

### Vault Account

The `VaultAccount` is a regular Solana Token Account.

## Types

A number of 4 type variants are defined in the Nosana Jobs Program's state.

### Order

The `Order` struct is type used to describe orders in the market.

A number of 3 variants are defined in this `struct`:
| Name                                  | Type                                  |
|---------------------------------------|---------------------------------------|
| `user`                                | `publicKey`                           |
| `ipfsJob`                             | `["u8",32]`                           |
| `jobPrice`                            | `u64`                                 |

### Queue Type

The `QueueType` describes the type of queue

A number of 3 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Job`                                 | `0`                                   |
| `Node`                                | `1`                                   |
| `Empty`                               | `2`                                   |

### Job Status

The `JobStatus` describes the status of a job.

A number of 5 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Null`                                | `0`                                   |
| `Running`                             | `1`                                   |
| `Done`                                | `2`                                   |
| `Stopped`                             | `3`                                   |
| `Dummy`                               | `4`                                   |

### Job Type

The `JobType` describes the type of any job.

A number of 6 variants are defined in this `enum`:
| Name                                  | Number                                |
|---------------------------------------|---------------------------------------|
| `Default`                             | `0`                                   |
| `Small`                               | `1`                                   |
| `Medium`                              | `2`                                   |
| `Large`                               | `3`                                   |
| `Gpu`                                 | `4`                                   |
| `Unknown`                             | `255`                                 |

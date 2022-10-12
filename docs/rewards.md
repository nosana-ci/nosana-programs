# Nosana Rewards

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp)                                          |
| Accounts        | [`3`](#accounts)                                                                                                                    |
| Instructions    | [`6`](#instructions)                                                                                                                |
| Types           | [`0`](#types)                                                                                                                       |
| Domain          | `nosana-rewards.sol`                                                                                                                |
|  Address        | [`nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp`](https://explorer.solana.com/address/nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp)    |

## Instructions

A number of 6 instruction are defined in the Nosana Rewards program.

To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
const programId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

### Init

The `init()` instruction initializes the [ReflectionAccount](#reflection-account)
and [VaultAccount](#vault-account).

#### Account Info

The following 7 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `mint`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The token Mint address for this instruction.                                                      |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |
| `rent`                 | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana rent address. Responsible for lamports.                                       |


#### Solana Dispatch ID

The Solana dispatch ID for the Init Instruction
is **`dc3bcfec6cfa2f64`**,
which can also be expressed as an 8 byte discriminator:

```json
[220,59,207,236,108,250,47,100]
```

#### Example with Anchor

To invoke the Init Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .init()
  .accounts({
    mint,              // 𐄂 writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### Enter

The `enter()` instruction initializes a user's [RewardsAccount](#rewards-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `systemProgram`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official Solana system program address. Responsible for system CPIs.                          |


#### Solana Dispatch ID

The Solana dispatch ID for the Enter Instruction
is **`8b31d172585b4d86`**,
which can also be expressed as an 8 byte discriminator:

```json
[139,49,209,114,88,91,77,134]
```

#### Example with Anchor

To invoke the Enter Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .enter()
  .accounts({
    reflection,        // ✓ writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    reward,            // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### Add Fee

The `addFee()` instruction sends amount of tokens to the [VaultAccount](#vault-account).

#### Account Info

The following 5 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `authority`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |

#### Arguments

The following 1 arguments should also be provided when invoking this instruction.

| Name                   | Type              | Size    | Offset  | Description                                               |
|------------------------|-------------------|---------|---------|-----------------------------------------------------------|
| `amount`               | `u64`             | `8`     | `0`     | The number of tokens.                                     |


#### Solana Dispatch ID

The Solana dispatch ID for the Add Fee Instruction
is **`43e1bdd4fd7b4c70`**,
which can also be expressed as an 8 byte discriminator:

```json
[67,225,189,212,253,123,76,112]
```

#### Example with Anchor

To invoke the Add Fee Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .addFee(
    amount,            // type: u64
  )
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### Claim

The `claim()` instruction sends a user's rewards to a given wallet.

#### Account Info

The following 7 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `user`                 | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The user token account that will debit/credit the tokens.                                         |
| `vault`                | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [VaultAccount](#vault-account) address.                                                       |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |
| `tokenProgram`         | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The official SPL Token Program address. Responsible for token CPIs.                               |


#### Solana Dispatch ID

The Solana dispatch ID for the Claim Instruction
is **`3ec6d6c1d59f6cd2`**,
which can also be expressed as an 8 byte discriminator:

```json
[62,198,214,193,213,159,108,210]
```

#### Example with Anchor

To invoke the Claim Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .claim()
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
    reward,            // ✓ writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .signers([authorityKey])
  .rpc();
```

### Sync

The `sync()` instruction re-calculates a users' reflection points.

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `stake`                | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The [StakeAccount](/programs/staking#stake-account) address.                                      |
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |


#### Solana Dispatch ID

The Solana dispatch ID for the Sync Instruction
is **`04db28a4159dbd58`**,
which can also be expressed as an 8 byte discriminator:

```json
[4,219,40,164,21,157,189,88]
```

#### Example with Anchor

To invoke the Sync Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .sync()
  .accounts({
    reward,            // ✓ writable, 𐄂 signer
    stake,             // 𐄂 writable, 𐄂 signer
    reflection,        // ✓ writable, 𐄂 signer
  })
  .rpc();
```

### Close

The `close()` instruction closes a users' [RewardsAccount](#rewards-account).

#### Account Info

The following 3 account addresses should be provided when invoking this instruction.

| Name                   | Type                                                                                    | Description                                                                                       |
|------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `reflection`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [ReflectionAccount](#reflection-account) address.                                             |
| `reward`               | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The [RewardAccount](#reward-account) address.                                                     |
| `authority`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The signing authority of the program invocation.                                                  |


#### Solana Dispatch ID

The Solana dispatch ID for the Close Instruction
is **`62a5c9b16c41ce60`**,
which can also be expressed as an 8 byte discriminator:

```json
[98,165,201,177,108,65,206,96]
```

#### Example with Anchor

To invoke the Close Instruction
with [Anchor TS](https://coral-xyz.github.io/anchor/ts/index.html).

```typescript
let tx = await program.methods
  .close()
  .accounts({
    reflection,        // ✓ writable, 𐄂 signer
    reward,            // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
  })
  .signers([authorityKey])
  .rpc();
```

## Accounts

A number of 3 accounts make up for the Nosana Rewards Program's state.

### Reflection Account

The `ReflectionAccount` struct holds all the information on the reflection pool.
The total size of this account is `89` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `rate`                      | `u128`                      | `16`    | `8`     | The current reward rate.                                                                          |
| `totalReflection`           | `u128`                      | `16`    | `24`    | The current total reflection.                                                                     |
| `totalXnos`                 | `u128`                      | `16`    | `40`    | The current total xNOS.                                                                           |
| `vault`                     | `publicKey`                 | `32`    | `56`    | The [VaultAccount](#vault-account) address.                                                       |
| `vaultBump`                 | `u8`                        | `1`     | `88`    | The bump for the [VaultAccount](#vault-account).                                                  |

#### Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Reflection Account
are **`cd99a036ef1adbbc`**, which can also be expressed in byte array:

```json
[205,153,160,54,239,26,219,188]
```

### Reward Account

The `RewardAccount` struct holds all the information for any given user account.
The total size of this account is `73` bytes.

| Name                        | Type                        | Size    | Offset  | Description                                                                                       |
|-----------------------------|-----------------------------|---------|---------|---------------------------------------------------------------------------------------------------|
| `authority`                 | `publicKey`                 | `32`    | `8`     | The signing authority of the program invocation.                                                  |
| `bump`                      | `u8`                        | `1`     | `40`    | n/a                                                                                               |
| `reflection`                | `u128`                      | `16`    | `41`    | The [ReflectionAccount](#reflection-account) address.                                             |
| `xnos`                      | `u128`                      | `16`    | `57`    | n/a                                                                                               |

#### Anchor Account Discriminator

The first 8 bytes, also known as Anchor's 8 byte discriminator, for the Reward Account
are **`e1511ffd54eaab81`**, which can also be expressed in byte array:

```json
[225,81,31,253,84,234,171,129]
```

### Vault Account

The `VaultAccount` is a regular Solana Token Account.

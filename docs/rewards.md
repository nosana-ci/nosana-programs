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
To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
const programId = new PublicKey('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```



### Init

The `init()` instruction initializes the [ReflectionAccount](#reflection-account)
and [VaultAccount](#vault-account).

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `mint`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Mint Account            |
| `reflection`      | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reflection Account      |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |
| `systemProgram`   | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The System Program Account  |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |
| `rent`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Rent Account            |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

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

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `reflection`      | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reflection Account      |
| `stake`           | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Stake Account           |
| `reward`          | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reward Account          |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |
| `systemProgram`   | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The System Program Account  |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

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

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `user`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The User Account            |
| `reflection`      | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reflection Account      |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |

#### Arguments

| Name                   | Size    | Offset  | Description                                               |
|------------------------|---------|---------|-----------------------------------------------------------|
| `amount`               | `8`     | `0`     | The Amount argument                                       |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

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

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `user`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The User Account            |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `reflection`      | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reflection Account      |
| `reward`          | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reward Account          |
| `stake`           | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Stake Account           |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

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

The `sync()` instruction re-calculates a users' reflection score.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `reward`          | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reward Account          |
| `stake`           | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Stake Account           |
| `reflection`      | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reflection Account      |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

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

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `reflection`      | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reflection Account      |
| `reward`          | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Reward Account          |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |

#### Example

To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html).

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




### Vault Account

The `VaultAccount` is a regular Solana Token Account.


### Reflection Account

The `ReflectionAccount` struct holds all the information on the reflection pool.

| Name                        | Type                        | Size    | Offset  |
|-----------------------------|-----------------------------|---------|---------|
| `rate`                      | `u128`                      | `16`    | `8`     |
| `totalReflection`           | `u128`                      | `16`    | `24`    |
| `totalXnos`                 | `u128`                      | `16`    | `40`    |
| `vault`                     | `publicKey`                 | `32`    | `56`    |
| `vaultBump`                 | `u8`                        | `1`     | `88`    |

### Reward Account

The `RewardAccount` struct holds all the information for any given user account.

| Name                        | Type                        | Size    | Offset  |
|-----------------------------|-----------------------------|---------|---------|
| `authority`                 | `publicKey`                 | `32`    | `8`     |
| `bump`                      | `u8`                        | `1`     | `40`    |
| `reflection`                | `u128`                      | `16`    | `41`    |
| `xnos`                      | `u128`                      | `16`    | `57`    |

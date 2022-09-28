# Nosana Staking

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                               |
| Source Code     | [GitHub](https://github.com/nosana-ci/nosana-programs)                                                                              |
| Build Status    | [Anchor Verified](https://www.apr.dev/program/nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE)                                          |
| Accounts        | [`3`](#accounts)                                                                                                                    |
| Instructions    | [`9`](#instructions)                                                                                                                |
| Types           | [`0`](#types)                                                                                                                       |
| Domain          | `nosana-staking.sol`                                                                                                                |
|  Address        | [`nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE`](https://explorer.solana.com/address/nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE)    |

## Instructions

A number of 9 instruction are defined in the Nosana Staking program.
To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
const programId = new PublicKey('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```



### Init

The `init()` instruction initializes the [SettingsAccount](#settings-account)
of the Nosana Staking program.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `settings`        | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Settings Account        |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |
| `systemProgram`   | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The System Program Account  |
| `rent`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Rent Account            |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .init()
  .accounts({
    settings,          // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```


### Stake

The `stake()` instruction creates a new stake [StakeAccount](#stake-account)
for the authority.
It initializes a unique [VaultAccount](#vault-account) for the staker.
This will transfer amount of NOS tokens from user to the vault locked
for duration seconds of time.
The stake account is a PDA based on the authority.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `mint`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Mint Account            |
| `user`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The User Account            |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |
| `systemProgram`   | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The System Program Account  |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |
| `rent`            | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Rent Account            |

#### Arguments

| Name                   | Size    | Offset  | Description                                     |
|------------------------|---------|---------|-------------------------------------------------|
| `amount`               | `8`     | `0`     | The Amount argument                             |
| `duration`             | `16`    | `8`     | The Duration argument                           |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .stake(
    amount,            // type: u64
    duration,          // type: u128
  )
  .accounts({
    mint,              // 𐄂 writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```


### Unstake

The `unstake()` instruction will initiate the unstake delay.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `reward`          | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Reward Account          |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .unstake()
  .accounts({
    stake,             // ✓ writable, 𐄂 signer
    reward,            // 𐄂 writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .rpc();
```


### Restake

The `restake()` instruction undoes an unstake.
This will make a stake active again and reset the unstake time.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .restake()
  .accounts({
    stake,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .rpc();
```


### Topup

The `topup()` instruction performs a top-up of an existing stake.
An `amount` of NOS is transferred to the vault and the stake is update.

- You can only top-up if the stake is not unstaked yet
- A top-up is always for the duration of the original stake

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `user`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The User Account            |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |

#### Arguments

| Name                   | Size    | Offset  | Description                                     |
|------------------------|---------|---------|-------------------------------------------------|
| `amount`               | `8`     | `0`     | The Amount argument                             |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .topup(
    amount,            // type: u64
  )
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```


### Extend

The `extend()` instruction extends the duration of a stake.
The duration can only be increased which will result in a higher `xnos`.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |

#### Arguments

| Name                   | Size    | Offset  | Description                                     |
|------------------------|---------|---------|-------------------------------------------------|
| `duration`             | `8`     | `0`     | The Duration argument                           |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .extend(
    duration,          // type: u64
  )
  .accounts({
    stake,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .rpc();
```


### Claim

The `claim()` instruction will transfer back all your stake tokens if the delay has
passed after they whey unstaked.
Claiming will close the [StakeAccount](#stake-account) and
[VaultAccount](#vault-account) of the staker.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `user`            | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The User Account            |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `authority`       | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="#3EAF7C" />       | The Authority Account       |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .claim()
  .accounts({
    user,              // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```


### Slash

The `slash()` instruction reduces a stake's NOS tokens.
This can only be done by the Slashing Authority declared in
[SettingsAccount](#settings-account) authority.
The tokens that are slashed will be sent to the [SettingsAccount](#settings-account)
tokenAccount account.

Slashing is a feature used by the Nosana Protocol to punish bad actors.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `settings`        | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Settings Account        |
| `stake`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Stake Account           |
| `tokenAccount`    | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Token Account Account   |
| `vault`           | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Vault Account           |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |
| `tokenProgram`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Program Account   |

#### Arguments

| Name                   | Size    | Offset  | Description                                     |
|------------------------|---------|---------|-------------------------------------------------|
| `amount`               | `8`     | `0`     | The Amount argument                             |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .slash(
    amount,            // type: u64
  )
  .accounts({
    settings,          // 𐄂 writable, 𐄂 signer
    stake,             // ✓ writable, 𐄂 signer
    tokenAccount,      // ✓ writable, 𐄂 signer
    vault,             // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```


### Update Setting

The `updateSettings()` instruction sets the Slashing Authority in
[SettingsAccount](#settings-account) authority to a new account.
It also sets the token account in [SettingsAccount](#settings-account) tokenAccount to a
new token account. This can only by called by the current authority.

#### Accounts

| Name              | Type                                                                                    | Description                 |
|-------------------|-----------------------------------------------------------------------------------------|-----------------------------|
| `newAuthority`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The New Authority Account   |
| `tokenAccount`    | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="lightgrey" />   | The Token Account Account   |
| `settings`        | <FontIcon icon="pencil" color="#3EAF7C" /><FontIcon icon="key" color="lightgrey" />     | The Settings Account        |
| `authority`       | <FontIcon icon="pencil" color="lightgrey" /><FontIcon icon="key" color="#3EAF7C" />     | The Authority Account       |



To run the instructions with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html)

```typescript
let tx = await program.methods
  .updateSettings()
  .accounts({
    newAuthority,      // 𐄂 writable, 𐄂 signer
    tokenAccount,      // 𐄂 writable, 𐄂 signer
    settings,          // ✓ writable, 𐄂 signer
    authority,         // 𐄂 writable, ✓ signer
  })
  .rpc();
```



## Accounts

A number of 3 accounts make up for the Nosana Staking Program's state.




### Vault Account

The `VaultAccount` is a regular Solana Token Account.


### Settings Account

The `SettingsAccount` struct holds the information about the
slashing authority and token account.

| Name                        | Type                        | Offset  |
|-----------------------------|-----------------------------|---------|
| `authority`                 | `publicKey`                 | `8`     |
| `tokenAccount`              | `publicKey`                 | `40`    |

### Stake Account

The `StakeAccount` struct holds all the information for any given stake.

| Name                        | Type                        | Offset  |
|-----------------------------|-----------------------------|---------|
| `amount`                    | `u64`                       | `8`     |
| `authority`                 | `publicKey`                 | `16`    |
| `duration`                  | `u64`                       | `48`    |
| `timeUnstake`               | `i64`                       | `56`    |
| `vault`                     | `publicKey`                 | `72`    |
| `vaultBump`                 | `u8`                        | `104`   |
| `xnos`                      | `u128`                      | `105`   |

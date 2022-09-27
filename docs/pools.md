# Nosana Pools

## Program Information

| Info            | Description                                                                                                                         |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Type            | [⚙️ Solana Program](https://docs.solana.com/developing/intro/programs#on-chain-programs)                                            |
| Source Code     | [👨‍💻GitHub](https://github.com/nosana-ci/nosana-programs)                                                                         |
| Build Status    | [✅ Anchor Verified](https://www.apr.dev/program/nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD)                                        |
| Accounts        | [`2` account types](#accounts)                                                                                                      |
| Instructions    | [`4` instructions](#instructions)                                                                                                   |
| Domain          | 🌐 `nosana-pools.sol`                                                                                                               |
| Program Address | [🧭 `nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD`](https://explorer.solana.com/address/nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD) |

## Instructions

A number of 4 instruction are defined in the Nosana Pools program.
To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html) in `TypeScript`:

```typescript
const programId = new PublicKey('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

### Open

The `open()` instruction lets you open a Nosana Pool's [PoolAccount](#pool-account)
and [VaultAccount](#vault-account).

```typescript
let tx = await program.methods
  .open(
    emmission,         // type: u64
    startTime,         // type: i64
    claimType,         // type: u8
    closeable,         // type: bool
  )
  .accounts({
    pool,              // ✓ writable, ✓ signer
    vault,             // ✓ writable, 𐄂 signer
    beneficiary,       // 𐄂 writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    mint,              // 𐄂 writable, 𐄂 signer
    systemProgram,     // 𐄂 writable, 𐄂 signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    rent,              // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Claim Fee

The `claimFee()` instruction claims emissions from a Nosana Pool
with claim type [`1`](#claim-type),
and adds these as rewards (fees) to the [Rewards Program](/programs/rewards).

```typescript
let tx = await program.methods
  .claimFee()
  .accounts({
    vault,             // ✓ writable, 𐄂 signer
    rewardsReflection, // ✓ writable, 𐄂 signer
    rewardsVault,      // ✓ writable, 𐄂 signer
    pool,              // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
    rewardsProgram,    // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Claim Transfer

The `claimTransfer()` instruction claims emissions from a Nosana Pool
with claim type [`0`](#claim-type),
and transfer these to a given user.

```typescript
let tx = await program.methods
  .claimTransfer()
  .accounts({
    vault,             // ✓ writable, 𐄂 signer
    beneficiary,       // ✓ writable, 𐄂 signer
    pool,              // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Close

The `close()` instruction closes a Nosana Pool's [PoolAccount](#pool-account)
and [VaultAccount](#vault-account)..

```typescript
let tx = await program.methods
  .close()
  .accounts({
    vault,             // ✓ writable, 𐄂 signer
    user,              // ✓ writable, 𐄂 signer
    pool,              // ✓ writable, 𐄂 signer
    authority,         // ✓ writable, ✓ signer
    tokenProgram,      // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

## Accounts

A number of 2 accounts make up for the Nosana Pools Program's state.

### Vault Account

The `VaultAccount` is a regular Solana Token Account.

### Pool Account

The `PoolAccount` struct holds all the information for any given pool.

| Name                        | Type                        | Offset  |
|-----------------------------|-----------------------------|---------|
| `authority`                 | `publicKey`                 | `8`     |
| `beneficiary`               | `publicKey`                 | `40`    |
| `claimType`                 | `u8`                        | `72`    |
| `claimedTokens`             | `u64`                       | `73`    |
| `closeable`                 | `bool`                      | `81`    |
| `emission`                  | `u64`                       | `82`    |
| `startTime`                 | `i64`                       | `90`    |
| `vault`                     | `publicKey`                 | `106`   |
| `vaultBump`                 | `u8`                        | `138`   |

## Types

A number of 1 type variants are defined in the Nosana Pools Program's state.

### Claim Type

The `ClaimType` of any pool describes the way withdraw (claim) works.

A number of 3 variants are defined:
| Name                                  | byte                                  |
|---------------------------------------|---------------------------------------|
| `Transfer`                            | `0`                                   |
| `AddFee`                              | `1`                                   |
| `Unknown`                             | `255`                                 |

# Nosana Jobs

## Instructions

A number of 10 instruction are defined in the Nosana Jobs program.
To load the program with [Anchor](https://coral-xyz.github.io/anchor/ts/index.html) in `TypeScript`:

```typescript
const programId = new PublicKey('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM');
const idl = await Program.fetchIdl(programId.toString());
const program = new Program(idl, programId);
```

### Init

The `init()` instruction initializes a [MarketAccount](#market-account) and an
associated [VaultAccount](#vault-account) for token deposits.

```typescript
let tx = await program.methods
  .init()
  .accounts({
    mint, // 𐄂 writable, 𐄂 signer
    market, // ✓ writable, ✓ signer
    vault, // ✓ writable, 𐄂 signer
    authority, // ✓ writable, ✓ signer
    accessKey, // 𐄂 writable, 𐄂 signer
    rent, // 𐄂 writable, 𐄂 signer
    systemProgram, // 𐄂 writable, 𐄂 signer
    tokenProgram, // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Stop

The `stop()` instruction closes a [MarketAccount](#market-account) and an
associated [VaultAccount](#vault-account).
The vault has to be empty of tokens.

```typescript
let tx = await program.methods
  .stop()
  .accounts({
    market, // ✓ writable, 𐄂 signer
    vault, // 𐄂 writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
    tokenProgram, // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Update

The `update()` instruction update a [MarketAccount](#market-account).

```typescript
let tx = await program.methods
  .update()
  .accounts({
    market, // ✓ writable, 𐄂 signer
    accessKey, // 𐄂 writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
  })
  .rpc();
```

### Create

The `create()` instruction creates a [JobAccount](#job-account) with its required data.
When there is a node ready in the queue it will immediately start running.

```typescript
let tx = await program.methods
  .create()
  .accounts({
    job, // ✓ writable, ✓ signer
    market, // ✓ writable, 𐄂 signer
    vault, // ✓ writable, 𐄂 signer
    user, // ✓ writable, 𐄂 signer
    feePayer, // ✓ writable, ✓ signer
    authority, // 𐄂 writable, ✓ signer
    rewardsReflection, // ✓ writable, 𐄂 signer
    rewardsVault, // ✓ writable, 𐄂 signer
    rewardsProgram, // 𐄂 writable, 𐄂 signer
    tokenProgram, // 𐄂 writable, 𐄂 signer
    systemProgram, // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Close

The `close()` instruction closes an existing [JobAccount](#job-account).
When the job was still queued the tokens will be returned to the user.

```typescript
let tx = await program.methods
  .close()
  .accounts({
    job, // ✓ writable, 𐄂 signer
    market, // 𐄂 writable, 𐄂 signer
    vault, // ✓ writable, 𐄂 signer
    user, // ✓ writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
    tokenProgram, // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Cancel

With the `cancel()` instruction a node can stop running a job that it has started.

```typescript
let tx = await program.methods
  .cancel()
  .accounts({
    job, // ✓ writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
  })
  .rpc();
```

### Claim

With the claim() instruction a node can claim a job that is:

- In the Queued (`0`) state.
- In the Running (`1`) state, but after is has expired.

#### Unclaimed Jobs

To find unclaimed jobs with Anchor:

```typescript
const jobs = await program.account.jobAccount.all([
{
memcmp: {
offset: 8 + 32 * 3, /// the assigned node must be NULL
bytes: systemProgram.toBase58(),
},
},
{
memcmp: {
offset: 8 + 32 * 4, /// the nodes queue
bytes: nodes.toBase58(),
},
},
{
memcmp: {
offset: 8 + 32 * 5 + 8, /// the job status
bytes: '1',
},
},
]);
```
Note: leave the nodes out to find jobs across all node queues.

#### Expired Jobs

To find jobs that have timed out, we first find all running jobs.

```typescript
const jobs = await program.account.jobAccount.all([
{
memcmp: {
offset: 8 + 32 * 4, // the nodes queue
bytes: nodes.toBase58(),
},
},
{
memcmp: {
offset: 8 + 32 * 5 + 8, ///the job status
bytes: '2',
},
},
]);
```

With the retrieved running jobs we can find jobs that have expired,
by checking their start time:

```typescript
for (const job of jobs) {
if (job.account.timeStart > (Date.now() / 1e3 - nodes.jobTimeout)) {
/// claim job!
}
}
```

```typescript
let tx = await program.methods
  .claim()
  .accounts({
    job, // ✓ writable, 𐄂 signer
    market, // ✓ writable, 𐄂 signer
    vault, // ✓ writable, 𐄂 signer
    stake, // 𐄂 writable, 𐄂 signer
    nft, // 𐄂 writable, 𐄂 signer
    metadata, // 𐄂 writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
  })
  .rpc();
```

### Enter

With the `enter()` instruction a node enters the [MarketAccount](#market-account) queue.

A few requirements are enforced:

- A node needs to have a minimum stake in Nosana Staking.
- A node needs to hold an official Nosana NFT.
- A node can only enter the queue once

```typescript
let tx = await program.methods
  .enter()
  .accounts({
    authority, // 𐄂 writable, ✓ signer
    market, // ✓ writable, 𐄂 signer
    vault, // ✓ writable, 𐄂 signer
    stake, // 𐄂 writable, 𐄂 signer
    nft, // 𐄂 writable, 𐄂 signer
    metadata, // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

### Exit

With the `exit()` instruction a node exits the node queue
from a [MarketAccount](#market-account).

```typescript
let tx = await program.methods
  .exit()
  .accounts({
    market, // ✓ writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
  })
  .rpc();
```

### Finish

With the `finish()` instruction a node can can post the result for a job it has finished,
and be reimbursed for the work.

```typescript
let tx = await program.methods
  .finish()
  .accounts({
    job, // ✓ writable, 𐄂 signer
    market, // 𐄂 writable, 𐄂 signer
    vault, // ✓ writable, 𐄂 signer
    user, // ✓ writable, 𐄂 signer
    authority, // 𐄂 writable, ✓ signer
    tokenProgram, // 𐄂 writable, 𐄂 signer
  })
  .rpc();
```

## Accounts

A number of 2 accounts make up for the Nosana Jobs Program's state.

### Vault Account

The `VaultAccount` is a regular Solana Token Account.

### Market Account

The `MarketAccount` struct holds all the information about jobs and the nodes queue.

| Name | Type |
| ---- | ---- |
| `authority` | `publicKey` |
| `jobPrice` | `u64` |
| `jobTimeout` | `i64` |
| `jobType` | `u8` |
| `vault` | `publicKey` |
| `vaultBump` | `u8` |
| `nodeAccessKey` | `publicKey` |
| `nodeStakeMinimum` | `u64` |
| `nodeQueue` | `[object Object]` |

### Job Account

The `JobAccount` struct holds all the information about any individual jobs.

| Name | Type |
| ---- | ---- |
| `authority` | `publicKey` |
| `ipfsJob` | `[object Object]` |
| `ipfsResult` | `[object Object]` |
| `market` | `publicKey` |
| `node` | `publicKey` |
| `price` | `u64` |
| `status` | `u8` |
| `timeEnd` | `i64` |
| `timeStart` | `i64` |

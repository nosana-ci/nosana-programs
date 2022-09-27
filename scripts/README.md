# Scripts

We maintain a number of scripts to interact with the Nosana Programns.

## Prerequisites

```shell
export ANCHOR_PROVIDER_URL=https://ssc-dao.genesysgo.net
export ANCHOR_WALLET=$HOME/.config/solana/id.json
```

## Scripts

### Claim Fee Pool

To claim fees from a [Nosana Pool](https://docs.nosana.io/programs/pools.html).

```shell
npm run script:claim-fee-pool
```

### Create Fee Distribution Pool

To create a [Nosana Pool](https://docs.nosana.io/programs/pools.html) of type 1

```shell
npm run script:create-fee-dist-pool
```

### Create Vesting Pool

To create a [Nosana Pool](https://docs.nosana.io/programs/pools.html) of type 0

```shell
npm run script:create-vesting-pool
```

### Nosana Mint Pass Lottery

This script will make a snapshot of all the stakers, calculate their
Nosana tier and their number of tickets, and perform a lottery for
selecting winners of the SFT. It can optionally wait for a block
height nearby which it will attempt to make the snapshot.

```shell
npm run script:draw-mint-pass-lottery $WAIT_FOR_BLOCK_TIME $TOTAL_DRAWS
```

- The `$WAIT_FOR_BLOCK_TIME` is the block time we will wait for before
drawing, and will be used for seeding the PRNG.
- The `$TOTAL_DRAWS`: How many mint passes will be distributed

### Generate docs

To compile standard Nosana Documentation from the rust code

```shell
npm run script:generate-docs
```

To replace existing documentation.

```shell
npm run script:generate-docs $PATH_TO_DOCS_PROGRAMS
```

### Get Staking Address

Get a [StakingAccount](https://docs.nosana.io/programs/staking.html#stake-account)
address for a given public key.

```shell
npm run script:get-staking-address $PUBLIC_KEY
```

### Init Rewards

Initialize the [Nosana Rewards](https://docs.nosana.io/programs/rewards.html) program.

```shell
npm run script:init-rewards
```

### Sync rewards

To sync reward accounts across Solana.

```shell
npm run script:sync-rewards
```

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

In the top of the file configure the following parameters:

- `totalDraws`: How many mint passes will be distributed
- `waitForBlock`: optional: A Solana blockheight to wait for before making the snapshot

```shell
npm run script:draw-mint-pass-lottery -- <wait_for_block_time>
```

The `<wait_for_block_time>` is the block time we will wait for before
drawing, and will be used for seeding the PRNG.

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

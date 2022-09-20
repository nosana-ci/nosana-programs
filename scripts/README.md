# Scripts

## Prereqs

```shell
export ANCHOR_PROVIDER_URL=https://ssc-dao.genesysgo.net
export ANCHOR_WALLET=$HOME/.config/solana/id.json
```

## Sync rewards

```shell
npx ts-node sync-rewards.ts
```

## Open the mining pool

```shell
npx ts-node create-fee-dist-pool.ts
```

## Nosana Mint Pass Lottery

This script will make a snapshot of all the stakers, calculate their
Nosana tier and their number of tickets, and perform a lottery for
selecting winners of the SFT. It can optionally wait for a block
height nearby which it will attempt to make the snapshot.

In the top of the file configure the following parameters:

- `totalDraws`: How many mint passes will be distributed
- `waitForBlock`: optional: A Solana blockheight to wait for before making the snapshot

```shell
npx ts-node draw-mint-pass-lottery.ts
```

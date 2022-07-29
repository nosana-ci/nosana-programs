# Nosana Staking

The staking program allows users to stake NOS tokens for a variable amount of time.
There are 2 values associated with a users stake:

- Staked NOS
- xNOS (Staked NOS x duration)

The staked NOS is the amount of tokens that the vault actually holds for the user that can be slashed or unstaked, while xNOS is a value indicating a users rank for purposes like giveaways and voting.

## Instructions

### InitVault

Initializes the Associated-Token-Account of the NOS token for the staking account.
All staked tokens end up here.

### Stake

Create a new stake for `authority`.
This will transfer `amount` of NOS tokens from `ata_from` to the `ata_vault` locked for at least `amount` seconds of time.
The new stake account is a PDA based on the `authority`.

### Topup

Performs a top-up of an existing stake.
`amount` of NOS is transferred to `ata_vault` and the tokens at `stake` are incremented.

- You can top-up for any `stake`
- You can only top-up if the `stake` is not unstaked yet
- A top-up is always for the duration of the original `stake`

### Restake

Undo an unstake. This will make a stake active again and reset the unstake time.

### Unstake

This will initiate the unstake delay.

### Claim

Claim will transfer back all your `stake` tokens if the delay has passed after they whey unstaked.
Claiming will close the `stake` account.

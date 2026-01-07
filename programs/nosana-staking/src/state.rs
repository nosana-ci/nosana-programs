use anchor_lang::prelude::*;
use light_sdk::{LightDiscriminator, LightHasher};

/***
 * Accounts
 */

/// The `SettingsAccount` struct holds the information about the
/// slashing authority and token account.
#[account]
pub struct SettingsAccount {
    pub authority: Pubkey,
    pub token_account: Pubkey,
}

impl SettingsAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<SettingsAccount>();

    pub fn set(&mut self, authority: Pubkey, token_account: Pubkey) -> Result<()> {
        self.authority = authority;
        self.token_account = token_account;
        Ok(())
    }
}

/// The `CompressedStakeAccount` struct holds all the information for any given stake
/// as a Light Protocol compressed account stored in a merkle tree.
#[event]
#[derive(Clone, Debug, Default, PartialEq, LightDiscriminator, LightHasher)]
pub struct CompressedStakeAccount {
    pub amount: u64,
    #[hash]
    pub authority: Pubkey,
    pub duration: u64,
    pub time_unstake: i64,
    #[hash]
    pub vault: Pubkey,
    pub vault_bump: u8,
    pub xnos: u128,
}

impl CompressedStakeAccount {
    pub const STAKE_MINIMUM: u64 = 0;
    pub const SECONDS_PER_DAY: u128 = 24 * 60 * 60;
    pub const DURATION_MIN: u128 = 14 * Self::SECONDS_PER_DAY; // 2 weeks
    pub const DURATION_MAX: u128 = 365 * Self::SECONDS_PER_DAY; // 1 year
    pub const XNOS_PRECISION: u128 = u128::pow(10, 15); // 1e15
    pub const XNOS_DIV: u128 = 4 * Self::DURATION_MAX / 12; // 0.25 growth per month

    pub fn new(
        amount: u64,
        authority: Pubkey,
        duration: u64,
        vault: Pubkey,
        vault_bump: u8,
    ) -> Self {
        let mut stake = Self {
            amount,
            authority,
            duration,
            time_unstake: 0,
            vault,
            vault_bump,
            xnos: 0,
        };
        stake.update_xnos();
        stake
    }

    pub fn unstake(&mut self, now: i64) {
        self.time_unstake = now;
        self.update_xnos();
    }

    pub fn restake(&mut self, amount: u64) {
        self.amount = amount;
        self.time_unstake = 0;
        self.update_xnos();
    }

    pub fn withdraw(&self, balance: u64, now: i64) -> u64 {
        let elapsed: u64 = u64::try_from(now - self.time_unstake).unwrap();
        if elapsed >= self.duration {
            balance
        } else {
            let precision: u64 = u64::MAX / std::cmp::max(self.amount, elapsed) - 1;
            elapsed * precision / self.duration * self.amount / precision - (self.amount - balance)
        }
    }

    pub fn topup(&mut self, amount: u64) {
        self.amount += amount;
        self.update_xnos();
    }

    pub fn slash(&mut self, amount: u64) {
        self.amount -= amount;
        self.update_xnos();
    }

    pub fn extend(&mut self, duration: u64) {
        self.duration += duration;
        self.update_xnos();
    }

    fn update_xnos(&mut self) {
        self.xnos = if self.time_unstake != 0 {
            0
        } else {
            (u128::from(self.duration) * Self::XNOS_PRECISION / Self::XNOS_DIV
                + Self::XNOS_PRECISION)
                * u128::from(self.amount)
                / Self::XNOS_PRECISION
        }
    }
}

use anchor_lang::prelude::*;
use nosana_common::constants::NOS_TOTAL_SUPPLY;

/***
 * Accounts
 */

/// The `ReflectionAccount` struct holds all the information on the reflection pool.
#[account]
pub struct ReflectionAccount {
    pub rate: u128,
    pub total_reflection: u128,
    pub total_xnos: u128,
    pub vault: Pubkey,
    pub vault_bump: u8,
}

impl ReflectionAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<ReflectionAccount>();

    /*
    This number should be as high as possible wihtout causing overflows.

    Rate gets multiplied by tokens to get reflections, and is the divisor of
    reflections to get the xnos. A higher initial rate makes sure that
    reflections will be large numbers. This is nice as total_xnos will be forever
    increasing.

    The formula below makes initial rate as large as it can be, and rounds it
    down a little to a clean multiple of the total supply.
    */
    pub const INITIAL_RATE: u128 = (u128::MAX - (u128::MAX % NOS_TOTAL_SUPPLY)) / NOS_TOTAL_SUPPLY;
    // pub const INITIAL_RATE: u128 = u128::pow(10, 15);

    pub fn init(&mut self, vault: Pubkey, vault_bump: u8) -> Result<()> {
        self.rate = ReflectionAccount::INITIAL_RATE;
        self.total_reflection = 0;
        self.total_xnos = 0;
        self.vault = vault;
        self.vault_bump = vault_bump;
        Ok(())
    }

    pub fn migrate(
        &mut self,
        rate: u128,
        reflection: u128,
        xnos: u128,
        vault: Pubkey,
        vault_bump: u8,
    ) {
        self.rate = rate;
        self.total_reflection = reflection;
        self.total_xnos = xnos;
        self.vault = vault;
        self.vault_bump = vault_bump;
    }

    pub fn add_fee(&mut self, fee: u128) {
        self.total_xnos += fee;
        self.rate = self.total_reflection / self.total_xnos;
    }

    pub fn add_rewards_account(&mut self, xnos: u128, reward_xnos: u128) -> u128 {
        let reflection: u128 = (xnos + reward_xnos) * self.rate;

        self.total_reflection += reflection;
        self.total_xnos += xnos;

        reflection
    }

    pub fn remove_rewards_account(&mut self, reflection: u128, xnos: u128) -> Result<()> {
        self.total_xnos -= xnos;
        self.total_reflection -= reflection;
        Ok(())
    }
}

/// The `RewardAccount` struct holds all the information for any given user account.
#[account]
pub struct RewardAccount {
    pub authority: Pubkey,
    pub bump: u8,
    pub reflection: u128,
    pub xnos: u128,
}

impl RewardAccount {
    pub const SIZE: usize = 8 + std::mem::size_of::<RewardAccount>();

    pub fn init(
        &mut self,
        authority: Pubkey,
        bump: u8,
        reflection: u128,
        tokens: u128,
    ) -> Result<()> {
        self.authority = authority;
        self.bump = bump;
        self.reflection = reflection;
        self.xnos = tokens;
        Ok(())
    }

    pub fn update(&mut self, reflection: u128, xnos: u128) -> Result<()> {
        self.reflection = reflection;
        self.xnos = xnos;
        Ok(())
    }

    pub fn get_amount(&mut self, rate: u128) -> u128 {
        self.reflection / rate - self.xnos
    }
}

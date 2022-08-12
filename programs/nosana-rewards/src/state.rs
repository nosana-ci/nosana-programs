use anchor_lang::prelude::*;

pub mod constants {
    // TODO: check this number as large as we can go without reaching an overflow in the arithmatics
    pub const INITIAL_RATE: u128 = u128::pow(10, 15);
}

/// # Stats

pub const STATS_SIZE: usize = 8 + std::mem::size_of::<StatsAccount>();

#[account]
pub struct StatsAccount {
    pub bump: u8,
    pub rate: u128,
    pub total_reflection: u128,
    pub total_xnos: u128,
}

impl StatsAccount {
    pub fn init(&mut self, bump: u8) {
        self.bump = bump;
        self.total_reflection = 0;
        self.total_xnos = 0;
        self.rate = constants::INITIAL_RATE;
    }

    pub fn add_fee(&mut self, fee: u128) {
        self.total_xnos += fee;
        self.rate = self.total_reflection.checked_div(self.total_xnos).unwrap()
    }

    pub fn add_rewards_account(&mut self, xnos: u128, reward_xnos: u128) -> u128 {
        let reflection: u128 = (xnos + reward_xnos).checked_mul(self.rate).unwrap();

        self.total_xnos += xnos;
        self.total_reflection += reflection;

        reflection
    }

    pub fn remove_rewards_account(&mut self, reflection: u128, xnos: u128) {
        self.total_xnos -= xnos;
        self.total_reflection -= reflection;
    }
}

/// # Reward

pub const REWARD_SIZE: usize = 8 + std::mem::size_of::<RewardAccount>();

#[account]
pub struct RewardAccount {
    pub authority: Pubkey,
    pub bump: u8,
    pub reflection: u128,
    pub xnos: u128,
}

impl RewardAccount {
    pub fn init(&mut self, authority: Pubkey, bump: u8, reflection: u128, tokens: u128) {
        self.authority = authority;
        self.bump = bump;
        self.reflection = reflection;
        self.xnos = tokens;
    }

    pub fn update(&mut self, reflection: u128, xnos: u128) {
        self.reflection = reflection;
        self.xnos = xnos;
    }

    pub fn get_amount(&mut self, rate: u128) -> u64 {
        u64::try_from(
            self.reflection
                .checked_div(rate)
                .unwrap()
                .checked_sub(self.xnos)
                .unwrap(),
        )
        .unwrap()
    }
}

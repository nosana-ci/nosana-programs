use anchor_lang::prelude::*;

// TODO: this is a magic number based on SafeMoon. should be as large as we can
// go without reaching an overflow in the arithmatics
pub const INITIAL_RATE: u128 = 12_736_648_300;

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

    pub fn update(&mut self, reflection: u128, tokens: u128) {
        self.reflection = reflection;
        self.xnos = tokens;
    }
}

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
        self.update_rate();
    }

    pub fn add_fee(&mut self, amount: u128) {
        self.total_xnos += amount;
        self.update_rate();
    }

    pub fn add_rewards_account(&mut self, xnos: u128) -> u128 {
        let reflection: u128 = self.xnos_to_reflection(xnos);

        self.total_xnos += xnos;
        self.total_reflection += reflection;
        self.update_rate();

        reflection
    }

    pub fn remove_rewards_account(&mut self, reflection: u128, xnos: u128) {
        self.total_xnos -= xnos;
        self.total_reflection -= reflection;
        self.update_rate();
    }

    pub fn update_rate(&mut self) {
        self.rate = if self.total_xnos == 0 {
            INITIAL_RATE
        } else {
            self.total_reflection.checked_div(self.total_xnos).unwrap()
        }
    }

    fn xnos_to_reflection(&mut self, xnos: u128) -> u128 {
        xnos.checked_mul(self.rate).unwrap()
    }
}

use anchor_lang::prelude::*;

// TODO: this is a magic number based on SafeMoon. should be as large as we can
// go without reaching an overflow in the arithmatics
pub const INITIAL_RATE: u128 = 12736648300;

pub const REWARD_SIZE: usize = 8 + std::mem::size_of::<RewardAccount>();

#[account]
pub struct RewardAccount {
    pub r_owned: u128,
    pub t_owned: u128,
    pub authority: Pubkey,
    pub bump: u8,
}

pub const STATS_SIZE: usize = 8 + std::mem::size_of::<StatsAccount>();

#[account]
pub struct StatsAccount {
    pub r_total: u128,
    pub t_total: u128,
    pub rate: u128,
    pub bump: u8,
}

impl StatsAccount {
    pub fn init(&mut self, bump: u8) {
        self.bump = bump;
        self.r_total = 0;
        self.t_total = 0;
        self.update_rate();
    }

    pub fn update_rate(&mut self) {
        if self.t_total == 0 {
            self.rate = INITIAL_RATE;
        } else {
            self.rate = self.r_total.checked_div(self.t_total).unwrap();
        }
    }

    pub fn tokens_to_reflection(&mut self, tokens: u128) -> u128 {
        return tokens.checked_mul(self.rate).unwrap();
    }
}

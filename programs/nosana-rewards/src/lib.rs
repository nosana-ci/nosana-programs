mod utils;

mod instructions;
mod state;

use anchor_lang::prelude::*;
use anchor_lang::declare_id;
use nosana_staking::program::NosanaStaking;
use nosana_staking::StakeAccount;
use instructions::*;
pub use state::*; // expose stake for cpi

declare_id!("8Ca1NWKayrZxiDhmLQyxZnBTCqGRb6V39yiKiKNRfQy1");

pub mod nos {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("TSTntXiYheDFtAdQ1pNBM2QQncA22PCFLLRr53uBa8i");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");

    pub const DECIMALS: u128 = 1_000_000;
}

#[error_code]
pub enum NosanaError {
    AlreadyUnstaked,
    StakeDecreased
}

#[program]
pub mod nosana_rewards {
    use super::*;

    pub fn init(ctx: Context<Init>) -> Result<()> {
        init::handler(ctx)
    }

    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        enter::handler(ctx)
    }

    pub fn add_fee(ctx: Context<AddFee>, amount: u64) -> Result<()> {
        add_fee::handler(ctx, amount)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }
}

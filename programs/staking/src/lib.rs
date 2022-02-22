mod macros;

use anchor_lang::prelude::*;
use anchor_spl::token::{self};

mod instructions;
mod ids;
mod state;
mod utils;

use instructions::*;
use ids::*;
use state::*;
use utils::*;

#[program]
pub mod staking {
    use super::*;

    pub fn create_user(_ctx: Context<User>, _bump: u8) -> ProgramResult {
        Ok(())
    }

    pub fn create_job(ctx: Context<Job>, bump: u8, amount: u64) -> ProgramResult {
        create_job::handler(ctx, bump, amount)
    }
}

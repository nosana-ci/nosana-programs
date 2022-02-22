mod macros;

use anchor_lang::prelude::*;
use anchor_spl::token::{self};

mod instructions;
mod ids;
mod state;

use instructions::*;
use ids::*;
use state::*;

#[program]
pub mod jobs {
    use super::*;

    pub fn initialize_project(ctx: Context<InitializeProject>, _bump: u8) -> ProgramResult {
        initialize_project::handler(ctx, _bump)
    }

    pub fn create_job(ctx: Context<CreateJob>, bump: u8, amount: u64) -> ProgramResult {
        create_job::handler(ctx, bump, amount)
    }
}

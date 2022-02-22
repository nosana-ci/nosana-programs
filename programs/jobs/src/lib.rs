mod macros;
mod instructions;
mod ids;
mod state;
mod error;

use anchor_lang::prelude::*;
use anchor_spl::token::{self};

use instructions::*;
use ids::*;
use state::*;
use error::*;

#[program]
pub mod jobs {
    use super::*;

    pub fn initialize_project(ctx: Context<InitializeProject>, _bump: u8) -> ProgramResult {
        initialize_project::handler(ctx, _bump)
    }

    pub fn create_job(ctx: Context<CreateJob>, _bump: u8, amount: u64) -> ProgramResult {
        create_job::handler(ctx, _bump, amount)
    }

    // pub fn list_jobs(ctx: Context<ListJobs>) -> ProgramResult {
    //     list_jobs::handler(ctx)
    // }
    //
    pub fn get_job(ctx: Context<GetJob>) -> ProgramResult {
        get_job::handler(ctx)
    }
}

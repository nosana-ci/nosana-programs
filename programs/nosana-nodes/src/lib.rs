mod errors;
mod instructions;
mod security;
mod state;
mod types;

use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use nosana_common::*;
use state::*;
use types::*;

declare_id!(id::NODES_PROGRAM);

#[program]
pub mod nosana_nodes {
    use super::*;

    /// Register a node to the Nosana Network
    pub fn register(ctx: Context<Register>, architecture_type: u8) -> Result<()> {
        ctx.accounts.handler(architecture_type)
    }

    /// Update a node to the Nosana Network
    pub fn update(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.handler()
    }
}

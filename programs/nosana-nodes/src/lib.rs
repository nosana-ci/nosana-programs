mod errors;
mod instructions;
mod security;
mod state;

use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use nosana_common::*;
use state::*;

declare_id!(id::NODES_PROGRAM);

#[program]
pub mod nosana_nodes {
    use super::*;

    /// Register a node to the Nosana Network
    pub fn register(ctx: Context<Register>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Update a node to the Nosana Network
    pub fn update(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.handler()
    }
}

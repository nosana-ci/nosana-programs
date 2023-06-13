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
    pub fn register(
        ctx: Context<Register>,
        architecture_type: u8,
        country_code: u16,
        cpu: u16,
        gpu: u16,
        memory: u16,
        iops: u16,
        storage: u16,
        endpoint: String,
        version: String,
    ) -> Result<()> {
        ctx.accounts.handler(
            architecture_type,
            country_code,
            cpu,
            gpu,
            memory,
            iops,
            storage,
            endpoint,
            version,
        )
    }

    /// Update a node to the Nosana Network
    pub fn update(
        ctx: Context<Update>,
        architecture_type: u8,
        country_code: u16,
        cpu: u16,
        gpu: u16,
        memory: u16,
        iops: u16,
        storage: u16,
        endpoint: String,
        version: String,
    ) -> Result<()> {
        ctx.accounts.handler(
            architecture_type,
            country_code,
            cpu,
            gpu,
            memory,
            iops,
            storage,
            endpoint,
            version,
        )
    }
}

mod instructions;
mod macros;
mod security;
mod state;

use anchor_lang::declare_id;
use anchor_lang::prelude::*;
use instructions::*;
use light_sdk::{cpi::CpiSigner, derive_light_cpi_signer};
use nosana_common::*;
pub use state::*; // expose state for cpi

declare_id!(id::REWARDS_PROGRAM);

/// CPI signer for Light Protocol compressed account read-only verification.
/// Derived from the rewards program ID.
pub const LIGHT_CPI_SIGNER: CpiSigner =
    derive_light_cpi_signer!("nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp");

#[program]
pub mod nosana_rewards {
    use super::*;

    /// Initialize the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault-account).
    pub fn init(ctx: Context<Init>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps.vault)
    }

    /// Initialize a [RewardsAccount](#rewards-account) using a compressed stake account.
    pub fn enter<'info>(
        ctx: Context<'_, '_, '_, 'info, Enter<'info>>,
        proof: light_sdk::instruction::ValidityProof,
        stake_account_meta: light_sdk::instruction::account_meta::CompressedAccountMetaReadOnly,
        stake_data: nosana_staking::CompressedStakeAccount,
    ) -> Result<()> {
        let bump = ctx.bumps.reward;
        Enter::handler(ctx, bump, proof, stake_account_meta, stake_data)
    }

    /// Send [NOS](/tokens/token) to the [VaultAccount](#vault-account).
    pub fn add_fee(ctx: Context<AddFee>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    /// Claim rewards from a [RewardsAccount](#rewards-account) using compressed stake verification.
    pub fn claim<'info>(
        ctx: Context<'_, '_, '_, 'info, Claim<'info>>,
        proof: light_sdk::instruction::ValidityProof,
        stake_account_meta: light_sdk::instruction::account_meta::CompressedAccountMetaReadOnly,
        stake_data: nosana_staking::CompressedStakeAccount,
    ) -> Result<()> {
        Claim::handler(ctx, proof, stake_account_meta, stake_data)
    }

    /// Re-calculate reflection points using compressed stake verification.
    pub fn sync<'info>(
        ctx: Context<'_, '_, '_, 'info, Sync<'info>>,
        proof: light_sdk::instruction::ValidityProof,
        stake_account_meta: light_sdk::instruction::account_meta::CompressedAccountMetaReadOnly,
        stake_data: nosana_staking::CompressedStakeAccount,
    ) -> Result<()> {
        Sync::handler(ctx, proof, stake_account_meta, stake_data)
    }

    /// Close a [RewardsAccount](#rewards-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }
}

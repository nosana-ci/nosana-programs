mod instructions;
mod state;
mod utils;

use instructions::*;
pub use state::*; // expose stake for cpi

use anchor_lang::prelude::*;
use nosana_common::staking;
use solana_security_txt::security_txt;

security_txt! {
    name: "Nosana Staking",
    project_url: "http://nosana.io",
    contacts: "email:team@nosana.io,link:https://nosana.io/security,discord:nosana#security",
    policy: "https://github.com/solana-labs/solana/blob/master/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/nosana-ci/nosana-programs",
    auditors: "TBD"
}

declare_id!(staking::ID);

#[program]
pub mod nosana_staking {
    use super::*;

    pub fn init_vault(ctx: Context<InitVault>) -> Result<()> {
        init_vault::handler(ctx)
    }

    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u64) -> Result<()> {
        stake::handler(ctx, amount, duration)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        unstake::handler(ctx)
    }

    pub fn restake(ctx: Context<Restake>) -> Result<()> {
        restake::handler(ctx)
    }

    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        topup::handler(ctx, amount)
    }

    pub fn extend(ctx: Context<Extend>, duration: u64) -> Result<()> {
        extend::handler(ctx, duration)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }
}

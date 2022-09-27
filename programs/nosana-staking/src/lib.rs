mod instructions;
mod security;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use nosana_common::*;
pub use state::*; // expose stake for cpi

declare_id!(id::STAKING_PROGRAM);

#[program]
pub mod nosana_staking {
    use super::*;

    /// ### Init
    ///
    /// The `init()` instruction initializes the [SettingsAccount](#settings-account)
    /// of the Nosana Staking program.
    ///
    pub fn init(ctx: Context<Init>) -> Result<()> {
        init::handler(ctx)
    }

    /// ### Stake
    ///
    /// The `stake()` instruction creates a new stake [StakeAccount](#stake-account)
    /// for the authority.
    /// It initializes a unique [VaultAccount](#vault-account) for the staker.
    /// This will transfer amount of NOS tokens from user to the vault locked
    /// for duration seconds of time.
    /// The stake account is a PDA based on the authority.
    ///
    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
        stake::handler(ctx, amount, duration)
    }

    /// ### Unstake
    ///
    /// The `unstake()` instruction will initiate the unstake delay.
    ///
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        unstake::handler(ctx)
    }

    /// ### Restake
    ///
    /// The `restake()` instruction undoes an unstake.
    /// This will make a stake active again and reset the unstake time.
    ///
    pub fn restake(ctx: Context<Restake>) -> Result<()> {
        restake::handler(ctx)
    }

    /// ### Topup
    ///
    /// The `topup()` instruction performs a top-up of an existing stake.
    /// An `amount` of NOS is transferred to the vault and the stake is update.
    ///
    /// - You can only top-up if the stake is not unstaked yet
    /// - A top-up is always for the duration of the original stake
    ///
    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        topup::handler(ctx, amount)
    }

    /// ### Extend
    ///
    /// The `extend()` instruction extends the duration of a stake.
    /// The duration can only be increased which will result in a higher `xnos`.
    ///
    pub fn extend(ctx: Context<Extend>, duration: u64) -> Result<()> {
        extend::handler(ctx, duration)
    }

    /// ### Claim
    ///
    /// The `claim()` instruction will transfer back all your stake tokens if the delay has
    /// passed after they whey unstaked.
    /// Claiming will close the [StakeAccount](#stake-account) and
    /// [VaultAccount](#vault-account) of the staker.
    ///
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::handler(ctx)
    }

    /// ### Slash
    ///
    /// The `slash()` instruction reduces a stake's NOS tokens.
    /// This can only be done by the Slashing Authority declared in
    /// [SettingsAccount](#settings-account) authority.
    /// The tokens that are slashed will be sent to the [SettingsAccount](#settings-account)
    /// tokenAccount account.
    ///
    /// Slashing is a feature used by the Nosana Protocol to punish bad actors.
    ///
    pub fn slash(ctx: Context<Slash>, amount: u64) -> Result<()> {
        slash::handler(ctx, amount)
    }

    /// ### Update Setting
    ///
    /// The `updateSettings()` instruction sets the Slashing Authority in
    /// [SettingsAccount](#settings-account) authority to a new account.
    /// It also sets the token account in [SettingsAccount](#settings-account) tokenAccount to a
    /// new token account. This can only by called by the current authority.
    ///
    pub fn update_settings(ctx: Context<UpdateSettings>) -> Result<()> {
        update_settings::handler(ctx)
    }
}

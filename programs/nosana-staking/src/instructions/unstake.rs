use crate::*;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMeta, ValidityProof},
};

/// Accounts for the unstake instruction.
/// The stake account is loaded from compressed account data.
#[derive(Accounts)]
pub struct Unstake<'info> {
    /// CHECK: we only want to verify this account does not exist
    #[account(
        address = pda::nosana_rewards(authority.key) @ NosanaError::InvalidAccount,
        constraint = utils::account_is_closed(&reward) @ NosanaStakingError::HasReward,
    )]
    pub reward: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Unstake<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Unstake<'info>>,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMeta,
        stake_data: CompressedStakeAccount,
    ) -> Result<()> {
        // Verify authority matches
        require!(
            stake_data.authority == ctx.accounts.authority.key(),
            NosanaError::Unauthorized
        );

        // Verify not already unstaked
        require!(
            stake_data.time_unstake == 0,
            NosanaStakingError::AlreadyUnstaked
        );

        // Load the compressed stake account for mutation
        let mut stake = LightAccount::<CompressedStakeAccount>::new_mut(
            &crate::ID,
            &stake_account_meta,
            stake_data,
        )?;

        // Set unstake time
        stake.unstake(Clock::get()?.unix_timestamp);

        // Set up Light CPI accounts and invoke
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(stake)?
            .invoke(light_cpi_accounts)?;

        Ok(())
    }
}

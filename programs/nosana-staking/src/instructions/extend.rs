use crate::*;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMeta, ValidityProof},
};

#[derive(Accounts)]
pub struct Extend<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Extend<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Extend<'info>>,
        duration: u64,
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

        // Verify duration
        require!(duration > 0, NosanaStakingError::DurationTooShort);

        // Verify new total duration
        require!(
            stake_data.duration + duration <= CompressedStakeAccount::DURATION_MAX.try_into().unwrap(),
            NosanaStakingError::DurationTooLong
        );

        // Load compressed stake account for mutation
        let mut stake = LightAccount::<CompressedStakeAccount>::new_mut(
            &crate::ID,
            &stake_account_meta,
            stake_data,
        )?;

        // Extend stake duration
        stake.extend(duration);

        // Invoke Light System Program
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

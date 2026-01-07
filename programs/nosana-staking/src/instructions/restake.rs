use crate::*;
use anchor_spl::token::TokenAccount;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMeta, ValidityProof},
};

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        constraint = vault.amount >= CompressedStakeAccount::STAKE_MINIMUM
            @ NosanaStakingError::AmountNotEnough,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Restake<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Restake<'info>>,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMeta,
        stake_data: CompressedStakeAccount,
    ) -> Result<()> {
        // Verify vault matches
        require!(
            stake_data.vault == ctx.accounts.vault.key(),
            NosanaError::InvalidVault
        );

        // Verify authority matches
        require!(
            stake_data.authority == ctx.accounts.authority.key(),
            NosanaError::Unauthorized
        );

        // Verify already unstaked (time_unstake != 0)
        require!(
            stake_data.time_unstake != 0,
            NosanaStakingError::AlreadyStaked
        );

        // Load compressed stake account for mutation
        let mut stake = LightAccount::<CompressedStakeAccount>::new_mut(
            &crate::ID,
            &stake_account_meta,
            stake_data,
        )?;

        // Restake with current vault balance
        stake.restake(ctx.accounts.vault.amount);

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

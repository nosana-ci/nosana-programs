use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMeta, ValidityProof},
};

#[derive(Accounts)]
pub struct Topup<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Topup<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Topup<'info>>,
        amount: u64,
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

        // Verify not already unstaked
        require!(
            stake_data.time_unstake == 0,
            NosanaStakingError::AlreadyUnstaked
        );

        // Verify amount
        require!(amount > 0, NosanaStakingError::AmountNotEnough);

        // Load compressed stake account for mutation
        let mut stake = LightAccount::<CompressedStakeAccount>::new_mut(
            &crate::ID,
            &stake_account_meta,
            stake_data,
        )?;

        // Topup stake
        stake.topup(amount);

        // Invoke Light System Program
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(stake)?
            .invoke(light_cpi_accounts)?;

        // Transfer tokens to the vault
        transfer_tokens_to_vault!(ctx.accounts, amount)
    }
}

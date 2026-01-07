use crate::*;
use anchor_spl::token::{close_account, CloseAccount, Token, TokenAccount};
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMeta, ValidityProof},
};

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault.amount == 0 @ NosanaError::VaultNotEmpty)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Close<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Close<'info>>,
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

        // Verify has been unstaked
        require!(
            stake_data.time_unstake != 0,
            NosanaStakingError::NotUnstaked
        );

        // Verify stake duration has passed (unlocked)
        let unlock_time = stake_data.time_unstake + i64::try_from(stake_data.duration).unwrap();
        require!(
            unlock_time < Clock::get()?.unix_timestamp,
            NosanaStakingError::Locked
        );

        // Load compressed stake account for closing
        let stake = LightAccount::<CompressedStakeAccount>::new_close(
            &crate::ID,
            &stake_account_meta,
            stake_data.clone(),
        )?;

        // Invoke Light System Program to delete the compressed account
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(stake)?
            .invoke(light_cpi_accounts)?;

        // Close the vault token account
        let vault_bump = stake_data.vault_bump;
        let authority_key = stake_data.authority;
        let mint = ctx.accounts.vault.mint;

        let seeds = &[
            constants::PREFIX_VAULT.as_bytes(),
            mint.as_ref(),
            authority_key.as_ref(),
            &[vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.authority.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        ))?;

        Ok(())
    }
}

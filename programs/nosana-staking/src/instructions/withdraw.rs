use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMetaReadOnly, ValidityProof},
};

/// Withdraw instruction - transfers tokens from vault based on unstake progress.
/// The stake account is read-only (not mutated) so we verify the proof without mutating.
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault.amount != 0 @ NosanaError::VaultEmpty)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Withdraw<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Withdraw<'info>>,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMetaReadOnly,
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

        // Create read-only Light Account for proof verification
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        let read_only_stake = LightAccount::<CompressedStakeAccount>::new_read_only(
            &crate::ID,
            &stake_account_meta,
            stake_data.clone(),
            light_cpi_accounts.tree_pubkeys().unwrap().as_slice(),
        )?;

        // Verify proof via Light System Program
        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(read_only_stake)?
            .invoke(light_cpi_accounts)?;

        // Calculate withdrawal amount based on elapsed time
        let amount: u64 = stake_data.withdraw(ctx.accounts.vault.amount, Clock::get()?.unix_timestamp);

        if amount > 0 {
            // Transfer tokens from vault using stake_data for seeds
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

            anchor_spl::token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    anchor_spl::token::Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.user.to_account_info(),
                        authority: ctx.accounts.vault.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount,
            )?;
        }

        Ok(())
    }
}

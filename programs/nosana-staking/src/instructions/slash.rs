use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMeta, ValidityProof},
};

#[derive(Accounts)]
pub struct Slash<'info> {
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, address = settings.token_account @ NosanaError::InvalidTokenAccount)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        has_one = authority @ NosanaError::Unauthorized,
        seeds = [ constants::PREFIX_SETTINGS.as_bytes() ],
        bump,
    )]
    pub settings: Account<'info, SettingsAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Slash<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Slash<'info>>,
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

        // Verify amount doesn't exceed stake
        require!(
            amount <= stake_data.amount,
            NosanaStakingError::AmountNotEnough
        );

        // Load compressed stake account for mutation
        let mut stake = LightAccount::<CompressedStakeAccount>::new_mut(
            &crate::ID,
            &stake_account_meta,
            stake_data.clone(),
        )?;

        // Slash stake
        stake.slash(amount);

        // Invoke Light System Program
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(stake)?
            .invoke(light_cpi_accounts)?;

        // Transfer slashed tokens from vault to token_account
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
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        Ok(())
    }
}

use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use light_sdk::{
    account::LightAccount,
    address::v2::derive_address,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{PackedAddressTreeInfo, ValidityProof},
};

/// Accounts for the stake instruction.
/// The stake account is created as a Light Protocol compressed account.
/// The vault remains a regular SPL Token account.
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ constants::PREFIX_VAULT.as_bytes(), mint.key().as_ref(), authority.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Stake<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Stake<'info>>,
        amount: u64,
        duration: u128,
        vault_bump: u8,
        proof: ValidityProof,
        address_tree_info: PackedAddressTreeInfo,
        output_state_tree_index: u8,
    ) -> Result<()> {
        // Validate duration and amount
        require!(
            duration >= CompressedStakeAccount::DURATION_MIN,
            NosanaStakingError::DurationTooShort
        );
        require!(
            duration <= CompressedStakeAccount::DURATION_MAX,
            NosanaStakingError::DurationTooLong
        );
        require!(
            amount >= CompressedStakeAccount::STAKE_MINIMUM,
            NosanaStakingError::AmountNotEnough
        );

        // Set up Light CPI accounts
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        // Derive the compressed account address
        let (address, address_seed) = derive_address(
            &[
                b"stake",
                ctx.accounts.mint.key().as_ref(),
                ctx.accounts.authority.key().as_ref(),
            ],
            &address_tree_info
                .get_tree_pubkey(&light_cpi_accounts)
                .map_err(|_| NosanaError::InvalidAccount)?,
            &crate::ID,
        );

        let new_address_params = address_tree_info.into_new_address_params_assigned_packed(address_seed, Some(output_state_tree_index));

        // Create the compressed stake account
        let mut stake = LightAccount::<CompressedStakeAccount>::new_init(
            &crate::ID,
            Some(address),
            output_state_tree_index,
        );

        // Initialize stake data
        let stake_data = CompressedStakeAccount::new(
            amount,
            ctx.accounts.authority.key(),
            duration.try_into().unwrap(),
            ctx.accounts.vault.key(),
            vault_bump,
        );
        stake.amount = stake_data.amount;
        stake.authority = stake_data.authority;
        stake.duration = stake_data.duration;
        stake.time_unstake = stake_data.time_unstake;
        stake.vault = stake_data.vault;
        stake.vault_bump = stake_data.vault_bump;
        stake.xnos = stake_data.xnos;

        // Invoke Light System Program to create the compressed account
        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(stake)?
            .with_new_addresses(&[new_address_params])
            .invoke(light_cpi_accounts)?;

        // Transfer tokens to the vault
        transfer_tokens_to_vault!(ctx.accounts, amount)
    }
}

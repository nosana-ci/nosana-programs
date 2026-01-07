use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMetaReadOnly, ValidityProof},
};
use nosana_staking::{CompressedStakeAccount, NosanaStakingError};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> Claim<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Claim<'info>>,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMetaReadOnly,
        stake_data: CompressedStakeAccount,
    ) -> Result<()> {
        // Verify stake authority matches reward authority
        require!(
            stake_data.authority == ctx.accounts.authority.key(),
            NosanaError::Unauthorized
        );

        // Verify not already unstaked
        require!(
            stake_data.time_unstake == 0,
            NosanaStakingError::AlreadyUnstaked
        );

        // Verify stake xnos hasn't decreased (prevents reward gaming)
        require!(
            stake_data.xnos >= ctx.accounts.reward.xnos,
            NosanaStakingError::Decreased
        );

        // Create read-only Light Account for proof verification
        let light_cpi_accounts = CpiAccounts::new(
            ctx.accounts.authority.as_ref(),
            ctx.remaining_accounts,
            crate::LIGHT_CPI_SIGNER,
        );

        let read_only_stake = LightAccount::<CompressedStakeAccount>::new_read_only(
            &nosana_staking::ID,
            &stake_account_meta,
            stake_data.clone(),
            light_cpi_accounts.tree_pubkeys().unwrap().as_slice(),
        )?;

        // Verify proof via Light System Program
        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(read_only_stake)?
            .invoke(light_cpi_accounts)?;

        // Determine amount to claim
        let amount: u128 = ctx.accounts.reward.get_amount(ctx.accounts.reflection.rate);
        if amount == 0 {
            return Ok(());
        }

        // Decrease the reflection pool
        ctx.accounts.reflection
            .remove_rewards_account(ctx.accounts.reward.reflection, ctx.accounts.reward.xnos + amount)?;

        // Re-enter the pool with the current stake (using verified xnos)
        ctx.accounts.reward.update(
            ctx.accounts.reflection.add_rewards_account(stake_data.xnos, 0),
            stake_data.xnos,
        )?;

        // Pay-out pending reward
        transfer_tokens_from_vault!(
            ctx.accounts,
            user,
            seeds!(ctx.accounts.reflection, ctx.accounts.vault),
            amount.try_into().unwrap()
        )
    }
}

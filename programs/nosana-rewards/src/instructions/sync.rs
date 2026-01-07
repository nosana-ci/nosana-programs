use crate::*;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMetaReadOnly, ValidityProof},
};
use nosana_staking::{CompressedStakeAccount, NosanaStakingError};

#[derive(Accounts)]
pub struct Sync<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized)]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Sync<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Sync<'info>>,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMetaReadOnly,
        stake_data: CompressedStakeAccount,
    ) -> Result<()> {
        // Verify stake authority matches reward authority
        require!(
            stake_data.authority == ctx.accounts.reward.authority,
            NosanaError::Unauthorized
        );

        // Verify not already unstaked
        require!(
            stake_data.time_unstake == 0,
            NosanaStakingError::AlreadyUnstaked
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

        // Decrease the reflection pool
        ctx.accounts.reflection
            .remove_rewards_account(ctx.accounts.reward.reflection, ctx.accounts.reward.xnos)?;

        // Re-enter the pool with the current stake (using verified xnos)
        let amount: u128 = ctx.accounts.reward.get_amount(ctx.accounts.reflection.rate);
        ctx.accounts.reward.update(
            ctx.accounts.reflection.add_rewards_account(stake_data.xnos, amount),
            stake_data.xnos,
        )
    }
}

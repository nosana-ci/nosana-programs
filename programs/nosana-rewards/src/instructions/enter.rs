use crate::*;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMetaReadOnly, ValidityProof},
};
use nosana_staking::{CompressedStakeAccount, NosanaStakingError};

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut)]
    pub reflection: Account<'info, ReflectionAccount>,
    #[account(
        init,
        payer = authority,
        space = RewardAccount::SIZE,
        seeds = [ constants::PREFIX_REWARDS.as_bytes(), authority.key().as_ref() ],
        bump,
    )]
    pub reward: Account<'info, RewardAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Enter<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Enter<'info>>,
        bump: u8,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMetaReadOnly,
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

        // Initialize reward account with verified stake data
        ctx.accounts.reward.init(
            ctx.accounts.authority.key(),
            bump,
            ctx.accounts.reflection.add_rewards_account(stake_data.xnos, 0),
            stake_data.xnos,
        )
    }
}

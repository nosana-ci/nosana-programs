use crate::*;
use anchor_spl::token::TokenAccount;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMetaReadOnly, ValidityProof},
};
use nosana_staking::CompressedStakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        mut,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        constraint = job.state == JobState::Stopped as u8 @ NosanaJobsError::JobInWrongState,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(init, payer = payer, space = RunAccount::SIZE)]
    pub run: Box<Account<'info, RunAccount>>,
    pub market: Account<'info, MarketAccount>,
    #[account(
        constraint = market.node_access_key == id::SYSTEM_PROGRAM || nft.owner == authority.key()
            @ NosanaJobsError::NodeNftWrongOwner,
        constraint = market.node_access_key == id::SYSTEM_PROGRAM || nft.amount >= 1
            @ NosanaJobsError::NodeNftInvalidAmount
    )]
    pub nft: Account<'info, TokenAccount>,
    /// CHECK: Metaplex metadata is verified against NFT and Collection node access key
    #[account(
        constraint = MarketAccount::metadata_constraint(&metadata, &nft.mint, market.node_access_key)
            @ NosanaJobsError::NodeKeyInvalidCollection,
    )]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Claim<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Claim<'info>>,
        proof: ValidityProof,
        stake_account_meta: CompressedAccountMetaReadOnly,
        stake_data: CompressedStakeAccount,
    ) -> Result<()> {
        // Verify stake authority matches
        require!(
            stake_data.authority == ctx.accounts.authority.key(),
            NosanaError::Unauthorized
        );

        // Verify stake xnos meets market minimum
        require!(
            stake_data.xnos >= ctx.accounts.market.node_xnos_minimum,
            NosanaJobsError::NodeNotEnoughStake
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
            stake_data,
            light_cpi_accounts.tree_pubkeys().unwrap().as_slice(),
        )?;

        // Verify proof via Light System Program
        LightSystemProgramCpi::new_cpi(crate::LIGHT_CPI_SIGNER, proof)
            .with_light_account(read_only_stake)?
            .invoke(light_cpi_accounts)?;

        // Create the run account
        ctx.accounts.run.create(
            ctx.accounts.job.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.payer.key(),
            Clock::get()?.unix_timestamp,
        )
    }
}

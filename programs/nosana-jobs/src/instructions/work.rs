use crate::*;
use anchor_spl::token::TokenAccount;
use light_sdk::{
    account::LightAccount,
    cpi::{v2::{CpiAccounts, LightSystemProgramCpi}, InvokeLightSystemProgram, LightCpiInstruction},
    instruction::{account_meta::CompressedAccountMetaReadOnly, ValidityProof},
};
use nosana_staking::CompressedStakeAccount;

#[derive(Accounts)]
pub struct Work<'info> {
    /// CHECK: the run account is created optionally
    #[account(
        mut,
        signer @ NosanaError::MissingSignature,
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        constraint = run.lamports() == 0 @ NosanaError::LamportsNonNull
    )]
    pub run: AccountInfo<'info>,
    #[account(
        mut,
        constraint = MarketAccount::node_constraint(authority.key, &market.queue, market.queue_type)
            @ NosanaJobsError::NodeAlreadyQueued
    )]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
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
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Work<'info> {
    pub fn handler(
        ctx: Context<'_, '_, '_, 'info, Work<'info>>,
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

        // Process work based on queue type
        match QueueType::from(ctx.accounts.market.queue_type) {
            QueueType::Node | QueueType::Empty => {
                ctx.accounts.market.add_to_queue(ctx.accounts.authority.key(), false)
            }
            QueueType::Job => RunAccount::initialize(
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.run.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.market.pop_from_queue(),
                ctx.accounts.authority.key(),
            ),
        }
    }
}

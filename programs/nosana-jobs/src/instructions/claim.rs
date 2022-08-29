use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::{
    pda::find_metadata_account,
    state::{Metadata, TokenMetadataAccount},
};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub project: Account<'info, ProjectAccount>,
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Initialized as u8 @ NosanaError::JobNotInitialized
    )]
    pub job: Account<'info, JobAccount>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.amount >= 10_000 * constants::NOS_DECIMALS @ NosanaError::NodeNotEnoughStake,
        constraint = stake.time_unstake == 0 @ NosanaError::NodeNoStake,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(constraint = nft.owner == authority.key() @ NosanaError::Unauthorized)]
    pub nft: Account<'info, TokenAccount>,
    /// CHECK: we're going to deserialize this account within the instruction
    #[account(address = find_metadata_account(&nft.mint).0 @ NosanaError::NodeNftWrongMetadata)]
    pub metadata: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    // get and verify our nft collection in the metadata
    let metadata: Metadata = Metadata::from_account_info(&ctx.accounts.metadata).unwrap();
    require!(
        metadata.collection.unwrap().key == id::NFT_COLLECTION,
        NosanaError::NodeNftWrongCollection
    );

    // get job and claim it
    (&mut ctx.accounts.job).claim(ctx.accounts.authority.key(), Clock::get()?.unix_timestamp);

    // get project and remove the job from the list
    (&mut ctx.accounts.project).remove_job(&ctx.accounts.job.key())
}

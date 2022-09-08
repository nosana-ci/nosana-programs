use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::{
    pda::find_metadata_account,
    state::{Metadata, TokenMetadataAccount},
};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub queue: Account<'info, JobsAccount>,
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub running: Account<'info, JobsAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.amount >= NODE_STAKE_MINIMUM @ NosanaError::NodeNotEnoughStake,
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

    // retrieve job
    let job: &mut Job = &mut ctx.accounts.queue.get_job(RequesterType::Node as u8);

    // claim job
    job.claim(Clock::get()?.unix_timestamp, ctx.accounts.authority.key());

    // check if there is a node ready
    (if job.has_data() {
        &mut ctx.accounts.running
    } else {
        &mut ctx.accounts.queue
    })
    .add_job(job.copy());

    // finish
    Ok(())
}

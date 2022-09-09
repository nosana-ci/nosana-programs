use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::{
    pda::find_metadata_account,
    state::{Metadata, TokenMetadataAccount},
};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Enter<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = vault @ NosanaError::JobInvalidVault)]
    pub nodes: Account<'info, NodesAccount>,
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
}

pub fn handler(ctx: Context<Enter>) -> Result<()> {
    // get and verify our nft collection in the metadata
    let metadata: Metadata = Metadata::from_account_info(&ctx.accounts.metadata).unwrap();
    require!(
        metadata.collection.unwrap().key == id::NFT_COLLECTION,
        NosanaError::NodeNftWrongCollection
    );

    // enter the queue
    ctx.accounts.nodes.enter(ctx.accounts.authority.key());

    // finish
    Ok(())
}

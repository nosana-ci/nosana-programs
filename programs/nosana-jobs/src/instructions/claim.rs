use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::pda::find_metadata_account;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        mut,
        has_one = market @ NosanaError::InvalidMarketAccount,
        constraint = job.state == JobState::Stopped as u8 @ NosanaError::JobInWrongState,
    )]
    pub job: Account<'info, JobAccount>,
    pub market: Account<'info, MarketAccount>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.xnos >= market.node_xnos_minimum as u128 @ NosanaError::NodeNotEnoughStake,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(constraint = nft.owner == authority.key() @ NosanaError::NodeNftWrongOwner)]
    pub nft: Account<'info, TokenAccount>,
    /// CHECK: Metaplex metadata is verfied against NFT and Collection node access key
    #[account(
        address = find_metadata_account(&nft.mint).0 @ NosanaError::NodeNftWrongMetadata,
        constraint = MarketAccount::metadata_constraint(&metadata, market.node_access_key)
            @ NosanaError::NodeKeyInvalidCollection,
    )]
    pub metadata: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    ctx.accounts
        .job
        .claim(ctx.accounts.authority.key(), Clock::get()?.unix_timestamp);
    Ok(())
}

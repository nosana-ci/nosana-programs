use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::{
    pda::find_metadata_account,
    state::{Collection, Metadata, TokenMetadataAccount},
};
use nosana_staking::StakeAccount;
use std::borrow::BorrowMut;

#[derive(Accounts)]
pub struct Enter<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.amount >= market.node_stake_minimum @ NosanaError::NodeNotEnoughStake,
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
    // get and verify our nft collection in the metadata, if required
    if ctx.accounts.market.node_access_key != id::SYSTEM_PROGRAM {
        let metadata: Metadata = Metadata::from_account_info(&ctx.accounts.metadata).unwrap();
        let collection: Collection = metadata.collection.unwrap();
        require!(
            collection.verified && collection.key == ctx.accounts.market.node_access_key,
            NosanaError::NodeKeyInvalidCollection
        )
    }

    // adjust the market
    let market: &mut MarketAccount = &mut ctx.accounts.market;
    match QueueType::from(market.queue_type) {
        QueueType::Node | QueueType::Unknown => {
            market.set_queue_type(QueueType::Node);
            require!(
                market.find_in_queue(ctx.accounts.authority.key).is_none(),
                NosanaError::NodeAlreadyQueued
            );
            market.add_to_queue(ctx.accounts.authority.key());
        }
        QueueType::Job => {
            let job_key: Pubkey = market.pop_from_queue();
            let index: Option<usize> = ctx
                .remaining_accounts
                .iter()
                .position(|account_info: &AccountInfo| account_info.key() == job_key);
            require!(index.is_some(), NosanaError::JobInfoNotFound);

            // get the correct job account from the remaining accounts
            let account_info: &AccountInfo = ctx.remaining_accounts.get(index.unwrap()).unwrap();

            // deserialize the job account
            let mut job: Account<JobAccount> = Account::try_from(account_info).unwrap();

            // try to get  mutable buffer for solana... TODO
            let job_mut: &mut JobAccount = job.borrow_mut();

            // write new data : TODO figure out how to persist the data
            job_mut.claim(ctx.accounts.authority.key(), Clock::get()?.unix_timestamp)
        }
    }
    Ok(())
}

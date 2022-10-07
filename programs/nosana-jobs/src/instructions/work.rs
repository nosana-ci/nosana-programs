use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::{
    pda::find_metadata_account,
    state::{Collection, Metadata, TokenMetadataAccount},
};
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Work<'info> {
    /// we're verifying that:
    ///  - if there's a job queued, a new account will be initialized
    ///  - this new account should not already have data in it
    ///  - if there is no job queued, we're using the dummy account that's already initialized
    #[account(
        init_if_needed,
        payer = payer,
        space = JobAccount::SIZE,
        constraint = JobAccount::is_created(&job) != MarketAccount::has_job(&market)
            @ NosanaError::JobAccountAlreadyInitialized,
        seeds = [ JobAccount::get_seed(MarketAccount::has_job(&market), seed.key()).as_ref() ],
        bump,
    )]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    /// CHECK: this is a key used as seed for the job account, set to default for the dummy account
    #[account(
        constraint = JobAccount::is_seed_allowed(MarketAccount::has_job(&market), seed.key())
            @ NosanaError::JobSeedAddressViolation,
    )]
    pub seed: AccountInfo<'info>,
    #[account(mut @ NosanaError::MarketNotMutable)]
    pub market: Account<'info, MarketAccount>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.amount >= market.node_stake_minimum @ NosanaError::NodeNotEnoughStake,
        constraint = stake.time_unstake == 0 @ NosanaError::NodeNoStake,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(constraint = nft.owner == authority.key() @ NosanaError::NodeNftWrongOwner)]
    pub nft: Account<'info, TokenAccount>,
    /// CHECK: we're going to deserialize this account within the instruction
    #[account(address = find_metadata_account(&nft.mint).0 @ NosanaError::NodeNftWrongMetadata)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Work>) -> Result<()> {
    // get and verify our nft collection in the metadata, if required
    if ctx.accounts.market.node_access_key != id::SYSTEM_PROGRAM {
        let metadata: Metadata = Metadata::from_account_info(&ctx.accounts.metadata).unwrap();
        let collection: Collection = metadata.collection.unwrap();
        require!(
            collection.verified && collection.key == ctx.accounts.market.node_access_key,
            NosanaError::NodeKeyInvalidCollection
        )
    }

    // load writable market
    let market_key: Pubkey = ctx.accounts.market.key();
    let market: &mut MarketAccount = &mut ctx.accounts.market;
    match QueueType::from(market.queue_type) {
        QueueType::Node | QueueType::Unknown => {
            require!(
                market
                    .find_node_in_queue(ctx.accounts.authority.key())
                    .is_none(),
                NosanaError::NodeAlreadyQueued
            );
            market.add_to_queue(Order::new_node(ctx.accounts.authority.key()))
        }
        QueueType::Job => {
            let order: Order = market.pop_from_queue();
            ctx.accounts.job.create(
                order.ipfs_job,
                market_key,
                ctx.accounts.authority.key(),
                ctx.accounts.payer.key(),
                market.job_price,
                order.user,
                Clock::get()?.unix_timestamp,
            )
        }
    }
    Ok(())
}

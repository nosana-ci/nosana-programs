use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::pda::find_metadata_account;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Work<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = JobAccount::SIZE,
        constraint = JobAccount::constraint(job.status, market.queue_type, QueueType::Job)
            @ NosanaError::JobConstraintNotSatisfied,
    )]
    pub job: Account<'info, JobAccount>, // use Box because the account limit is exceeded
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
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
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Work>) -> Result<()> {
    let market_key: Pubkey = ctx.accounts.market.key();
    // load writable market
    let market: &mut MarketAccount = &mut ctx.accounts.market;
    match QueueType::from(market.queue_type) {
        QueueType::Node | QueueType::Empty => {
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
                order.job_price,
                order.user,
                Clock::get()?.unix_timestamp,
            )
        }
    }
    Ok(())
}

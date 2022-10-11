use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::pda::find_metadata_account;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Work<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = RunAccount::SIZE,
        constraint = RunAccount::constraint(run.state, market.queue_type, QueueType::Job)
            @ NosanaError::RunConstraintNotSatisfied,
    )]
    pub run: Account<'info, RunAccount>,
    #[account(
        mut,
        constraint = MarketAccount::node_constraint(authority.key, &market.queue, market.queue_type)
            @ NosanaError::NodeAlreadyQueued
    )]
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
    match QueueType::from(ctx.accounts.market.queue_type) {
        QueueType::Node | QueueType::Empty => ctx
            .accounts
            .market
            .add_to_queue(ctx.accounts.authority.key(), false),

        QueueType::Job => ctx.accounts.run.create(
            ctx.accounts.market.pop_from_queue(),
            ctx.accounts.authority.key(),
            ctx.accounts.payer.key(),
            Clock::get()?.unix_timestamp,
        ),
    }
    Ok(())
}

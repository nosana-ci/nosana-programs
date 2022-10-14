use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::pda::find_metadata_account;
use nosana_staking::StakeAccount;

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
        address = pda::nosana_staking(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.xnos >= market.node_xnos_minimum @ NosanaJobsError::NodeNotEnoughStake,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(constraint = nft.owner == authority.key() @ NosanaJobsError::NodeNftWrongOwner)]
    pub nft: Account<'info, TokenAccount>,
    /// CHECK: Metaplex metadata is verified against NFT and Collection node access key
    #[account(
        address = find_metadata_account(&nft.mint).0 @ NosanaJobsError::NodeNftWrongMetadata,
        constraint = MarketAccount::metadata_constraint(&metadata, market.node_access_key)
            @ NosanaJobsError::NodeKeyInvalidCollection,
    )]
    pub metadata: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Work<'info> {
    pub fn handler(&mut self) -> Result<()> {
        match QueueType::from(self.market.queue_type) {
            QueueType::Node | QueueType::Empty => {
                self.market.add_to_queue(self.authority.key(), false)
            }
            QueueType::Job => RunAccount::initialize(
                self.payer.to_account_info(),
                self.run.to_account_info(),
                self.system_program.to_account_info(),
                self.market.pop_from_queue(),
                self.authority.key(),
            ),
        }
    }
}

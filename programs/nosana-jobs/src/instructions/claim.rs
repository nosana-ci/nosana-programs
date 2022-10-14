use crate::*;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::pda::find_metadata_account;
use nosana_staking::{NosanaStakingError, StakeAccount};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        mut,
        has_one = market @ NosanaJobsError::InvalidMarketAccount,
        constraint = job.state == JobState::Stopped as u8 @ NosanaJobsError::JobInWrongState,
    )]
    pub job: Account<'info, JobAccount>,
    #[account(init, payer = payer, space = RunAccount::SIZE)]
    pub run: Box<Account<'info, RunAccount>>,
    pub market: Account<'info, MarketAccount>,
    #[account(
        address = pda::nosana_staking(authority.key) @ NosanaStakingError::InvalidStakeAccount,
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
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Claim<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.job.claim(self.authority.key(), self.run.time);
        self.run.create(
            self.job.key(),
            self.authority.key(),
            self.payer.key(),
            Clock::get()?.unix_timestamp,
        )
    }
}

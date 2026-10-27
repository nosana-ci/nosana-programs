use crate::*;
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{Token, TokenAccount},
};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct List<'info> {
    #[account(init, payer = payer, space = JobAccount::SIZE)]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    #[account(
        mut,
        has_one = vault @ NosanaError::InvalidVault,
        constraint = !market.is_restricted()
            || (market_settings.is_some() && project_nft.is_some() && project_metadata.is_some())
            @ NosanaJobsError::AccessKeyMissing,
    )]
    pub market: Box<Account<'info, MarketAccount>>,
    /// CHECK: the run account is created optionally
    #[account(
        mut,
        signer @ NosanaError::MissingSignature,
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        constraint = run.lamports() == 0 @ NosanaError::LamportsNonNull
    )]
    pub run: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = market.job_price == 0 ||
            user.key() == get_associated_token_address(payer.key, &id::NOS_TOKEN)
            @ NosanaError::InvalidATA
    )]
    pub user: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub rewards_reflection: Account<'info, ReflectionAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub rewards_program: Program<'info, NosanaRewards>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    /// CHECK: the address is pinned by the seeds, only read when the market is restricted
    #[account(
        seeds = [ constants::PREFIX_SETTINGS, market.key().as_ref() ],
        bump,
        constraint = !market.is_restricted() || !MarketSettingsAccount::is_open(market_settings)
            @ NosanaJobsError::AccessKeyMissing,
    )]
    pub market_settings: Option<UncheckedAccount<'info>>,
    /// Only required when the market is restricted
    #[account(
        constraint = !market.is_restricted() || project_nft.owner == authority.key()
            @ NosanaJobsError::AccessNftWrongOwner,
        constraint = !market.is_restricted() || project_nft.amount >= 1
            @ NosanaJobsError::AccessNftInvalidAmount
    )]
    pub project_nft: Option<Account<'info, TokenAccount>>,
    /// CHECK: Metaplex metadata is verified against the NFT and the project access key
    #[account(
        constraint = !market.is_restricted() || project_nft.as_ref().zip(market_settings.as_ref()).is_some_and(|(nft, settings)|
            MarketAccount::metadata_constraint(
                project_metadata,
                &nft.mint,
                MarketSettingsAccount::project_access_key(settings),
            ))
            @ NosanaJobsError::AccessKeyInvalidCollection,
    )]
    pub project_metadata: Option<UncheckedAccount<'info>>,
}

impl<'info> List<'info> {
    pub fn handler(&mut self, ipfs_job: [u8; 32], timeout: i64) -> Result<()> {
        // create the job
        self.job.create(
            ipfs_job,
            self.market.key(),
            self.payer.key(),
            self.market.job_price,
            self.authority.key(),
            timeout,
        );

        // update the market
        match QueueType::from(self.market.queue_type) {
            QueueType::Job | QueueType::Empty => self.market.add_to_queue(self.job.key(), true),
            QueueType::Node => RunAccount::initialize(
                self.payer.to_account_info(),
                self.run.to_account_info(),
                self.system_program.key(),
                self.job.key(),
                self.market.pop_from_queue(),
            ),
        }?;

        if self.job.price == 0 {
            return Ok(());
        }

        // deposit job payment and transfer network fee
        let (deposit, fee) = self.job.get_deposit_and_fee(timeout);
        transfer_tokens_to_vault_with_signer!(self, payer, deposit)?;
        if fee == 0 {
            return Ok(());
        }
        transfer_fee!(self, user, payer, &[], fee)
    }
}

use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct List<'info> {
    #[account(init, payer = payer, space = JobAccount::SIZE)]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub market: Box<Account<'info, MarketAccount>>,
    /// CHECK: the run account is created optionally
    #[account(
        mut,
        signer @ NosanaError::MissingSignature,
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        constraint = run.lamports() == 0 @ NosanaError::LamportsNonNull
    )]
    pub run: AccountInfo<'info>,
    #[account(mut)]
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
}

impl<'info> List<'info> {
    pub fn handler(&mut self, ipfs_job: [u8; 32], timeout: i64) -> Result<()> {
        // pay job and network fee, when it's not a free market
        if self.market.job_price != 0 {
            transfer_tokens_to_vault!(self, self.market.get_deposit(timeout))?;
            transfer_fee!(self, user, authority, &[], self.market.job_fee(timeout))?;
        }

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
                self.system_program.to_account_info(),
                self.job.key(),
                self.market.pop_from_queue(),
            ),
        }
    }
}

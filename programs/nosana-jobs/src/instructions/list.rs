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
    fn handle_run_account(&mut self) -> Result<()> {
        // cpi system program
        RunAccount::cpi_init(
            self.run.to_account_info(),
            self.payer.to_account_info(),
            self.system_program.to_account_info(),
        );

        // get and modify run account
        let info: AccountInfo = self.run.to_account_info();
        let mut run: Account<RunAccount> = RunAccount::from_account_info(&info);
        run.create(
            self.job.key(),
            self.job.node,
            self.job.payer.key(),
            self.job.time_start,
        )?;

        // write
        run.serialize(self.run.to_account_info())
    }

    fn cpi_pay_job(&self) -> Result<()> {
        utils::cpi_transfer_tokens(
            self.user.to_account_info(),
            self.vault.to_account_info(),
            self.authority.to_account_info(),
            self.token_program.to_account_info(),
            &[],
            self.market.job_price,
        )
    }

    fn cpi_pay_fee(&self) -> Result<()> {
        nosana_rewards::cpi::add_fee(
            CpiContext::new(
                self.rewards_program.to_account_info(),
                AddFee {
                    user: self.user.to_account_info(),
                    reflection: self.rewards_reflection.to_account_info(),
                    vault: self.rewards_vault.to_account_info(),
                    authority: self.authority.to_account_info(),
                    token_program: self.token_program.to_account_info(),
                },
            ),
            self.market.job_price / MarketAccount::JOB_FEE_FRACTION,
        )
    }

    pub fn handler(&mut self, ipfs_job: [u8; 32]) -> Result<()> {
        // cpi token payments
        self.cpi_pay_job().unwrap();
        self.cpi_pay_fee().unwrap();

        // create the job
        self.job.create(
            ipfs_job,
            self.market.key(),
            self.payer.key(),
            self.market.job_price,
            self.authority.key(),
        );

        // update the market
        match QueueType::from(self.market.queue_type) {
            QueueType::Node => {
                self.job.claim(
                    self.market.pop_from_queue(),
                    Clock::get().unwrap().unix_timestamp,
                );
                self.handle_run_account()
            }
            QueueType::Job | QueueType::Empty => self.market.add_to_queue(self.job.key(), true),
        }
    }
}

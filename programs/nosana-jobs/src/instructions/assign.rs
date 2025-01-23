use crate::*;
use anchor_spl::token::{Token, TokenAccount};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct Assign<'info> {
    #[account(init, payer = payer, space = JobAccount::SIZE)]
    pub job: Box<Account<'info, JobAccount>>,
    #[account(
        mut,
        has_one = vault @ NosanaError::InvalidVault,
        constraint = market.queue_type == QueueType::Node as u8 @NosanaJobsError::MarketInWrongState
    )]
    pub market: Box<Account<'info, MarketAccount>>,
    /// CHECK: the run account is created optionally
    #[account(
    mut,
        signer @ NosanaError::MissingSignature,
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        constraint = run.lamports() == 0 @NosanaError::LamportsNonNull
    )]
    pub run: AccountInfo<'info>,
    /// CHECK: I need to work out how to import the NodeAccount type from nosana-nodes
    pub node: AccountInfo<'info>,
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

impl<'info> Assign<'info> {
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

        // remove node from queue and assign job
        match self.market.remove_from_queue(&self.node.key()) {
            Ok(_) => RunAccount::initialize(
                    self.payer.to_account_info(),
                    self.run.to_account_info(),
                    self.system_program.to_account_info(),
                    self.job.key(),
                    self.node.key(),
                ),
            Err(err) => Err(err),
        }?;

        if self.job.price == 0 {
            return Ok(());
        }

        // deposit job payment and transfer network fee
        let (deposit, fee) = self.job.get_deposit_and_fee(timeout);
        transfer_tokens_to_vault!(self, deposit)?;
        transfer_fee!(self, user, authority, &[], fee)
    }
}

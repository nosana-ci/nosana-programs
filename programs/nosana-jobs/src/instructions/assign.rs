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
        constraint = market.queue_type == QueueType::Node as u8 @ NosanaJobsError::MarketInWrongState
    )]
    pub market: Box<Account<'info, MarketAccount>>,
    #[account(init, payer = payer, space = RunAccount::SIZE)]
    pub run: Account<'info, RunAccount>,
    /// CHECK: this is the node to assign the job to
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
        // remove node from queue, create job and directly assign node to run account
        match self.market.remove_from_queue(&self.node.key()) {
            Ok(_) => {
                // create the job
                self.job.create(
                    ipfs_job,
                    self.market.key(),
                    self.payer.key(),
                    self.market.job_price,
                    self.authority.key(),
                    timeout,
                );
                self.run.create(
                    self.job.key(),
                    self.node.key(),
                    self.payer.key(),
                    Clock::get()?.unix_timestamp,
                )?;
            }
            Err(err) => Err(err)?,
        }

        if self.job.price == 0 {
            return Ok(());
        }

        // deposit job payment and transfer network fee
        let (deposit, fee) = self.job.get_deposit_and_fee(timeout);
        transfer_tokens_to_vault!(self, deposit)?;
        transfer_fee!(self, user, authority, &[], fee)
    }
}

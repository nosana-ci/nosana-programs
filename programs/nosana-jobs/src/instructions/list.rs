use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct List<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = JobAccount::SIZE,
        constraint = JobAccount::constraint(job.status, market.queue_type, QueueType::Node)
            @ NosanaError::JobConstraintNotSatisfied,
    )]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
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

pub fn handler(ctx: Context<List>, ipfs_job: [u8; 32]) -> Result<()> {
    // load writable market
    let market_key: Pubkey = ctx.accounts.market.key();
    let market: &mut MarketAccount = &mut ctx.accounts.market;
    match QueueType::from(market.queue_type) {
        QueueType::Job | QueueType::Empty => market.add_to_queue(Order::new_job(
            ctx.accounts.authority.key(),
            ipfs_job,
            market.job_price,
        )),
        QueueType::Node => ctx.accounts.job.create(
            ipfs_job,
            market_key,
            market.pop_from_queue().user,
            ctx.accounts.payer.key(),
            market.job_price,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        ),
    }

    // deposit tokens for the job
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        market.job_price,
    )?;

    // send fee to stakers
    nosana_rewards::cpi::add_fee(
        CpiContext::new(
            ctx.accounts.rewards_program.to_account_info(),
            AddFee {
                user: ctx.accounts.user.to_account_info(),
                reflection: ctx.accounts.rewards_reflection.to_account_info(),
                vault: ctx.accounts.rewards_vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        market.job_price / MarketAccount::JOB_FEE_FRACTION,
    )
}

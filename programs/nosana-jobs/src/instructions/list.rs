use crate::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};

#[derive(Accounts)]
pub struct List<'info> {
    /// we're verifying that:
    ///  - if there's a node queued, a new account will be initialized
    ///  - this new account should not already have data in it
    ///  - if there is no node queued, we're using the dummy account that's already initialized
    ///  - the seed key is used as init_if_needed validator
    #[account(
        init_if_needed,
        payer = payer,
        space = JobAccount::SIZE,
        constraint = MarketAccount::has_node(&market) != JobAccount::is_created(&job)
            @ NosanaError::JobAccountAlreadyInitialized,
        constraint = JobAccount::is_seed_allowed(MarketAccount::has_node(&market), seed.key())
            @ NosanaError::JobSeedAddressViolation,
        seeds = [ JobAccount::get_seed(MarketAccount::has_node(&market), seed.key()).as_ref() ],
        bump,
    )]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    /// CHECK: this is a key used as seed for the job account, validated above
    pub seed: AccountInfo<'info>,
    #[account(mut @ NosanaError::MarketNotMutable, has_one = vault @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    #[account(mut)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub rewards_reflection: Box<Account<'info, ReflectionAccount>>,
    #[account(mut)]
    pub rewards_vault: Box<Account<'info, TokenAccount>>,
    pub rewards_program: Program<'info, NosanaRewards>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<List>, ipfs_job: [u8; 32]) -> Result<()> {
    // load writable market
    let market_key: Pubkey = ctx.accounts.market.key();
    let market: &mut MarketAccount = &mut ctx.accounts.market;
    match QueueType::from(market.queue_type) {
        QueueType::Job | QueueType::Unknown => market.add_to_queue(Order::new_job(
            ctx.accounts.authority.key(),
            ipfs_job,
            market.job_price,
        )),
        QueueType::Node => ctx.accounts.job.create(
            ctx.accounts.authority.key(),
            ipfs_job,
            market_key,
            market.pop_from_queue().user,
            market.job_price,
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

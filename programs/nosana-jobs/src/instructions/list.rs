use crate::*;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use nosana_rewards::{cpi::accounts::AddFee, program::NosanaRewards, ReflectionAccount};
use writer::BpfWriter;

#[derive(Accounts)]
pub struct List<'info> {
    #[account(init, payer = payer, space = JobAccount::SIZE)]
    pub job: Box<Account<'info, JobAccount>>, // use Box because the account limit is exceeded
    #[account(mut, has_one = vault @ NosanaError::InvalidVault)]
    pub market: Box<Account<'info, MarketAccount>>,
    ///CHECK: the run account is created optionally
    #[account(
        mut,
        signer @ NosanaError::MissingSignature,
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        constraint = run.lamports() == 0 @ NosanaError::LamportsNonNull
    )]
    pub run: AccountInfo<'info>,
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
    // create the job
    ctx.accounts.job.create(
        ipfs_job,
        ctx.accounts.market.key(),
        ctx.accounts.payer.key(),
        ctx.accounts.market.job_price,
        ctx.accounts.authority.key(),
    );

    // update the market
    match QueueType::from(ctx.accounts.market.queue_type) {
        QueueType::Job | QueueType::Empty => ctx
            .accounts
            .market
            .add_to_queue(ctx.accounts.job.key(), true),

        QueueType::Node => {
            ctx.accounts.job.claim(
                ctx.accounts.market.pop_from_queue(),
                Clock::get()?.unix_timestamp,
            );

            // run account info
            let run_info: AccountInfo = ctx.accounts.run.to_account_info();

            // init run account
            create_account(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    CreateAccount {
                        from: ctx.accounts.payer.to_account_info(),
                        to: run_info.to_account_info(),
                    },
                )
                .with_signer(&[]),
                Rent::get()?.minimum_balance(RunAccount::SIZE),
                RunAccount::SIZE as u64,
                &id::JOBS_PROGRAM,
            )?;

            // modify run account
            let mut run: Account<RunAccount> = Account::try_from_unchecked(&run_info).unwrap();
            run.create(
                ctx.accounts.job.key(),
                ctx.accounts.job.node,
                ctx.accounts.job.payer.key(),
                ctx.accounts.job.time_start,
            );

            // serialize run account
            let dst: &mut [u8] = &mut run_info.try_borrow_mut_data().unwrap();
            let mut writer: BpfWriter<&mut [u8]> = BpfWriter::new(dst);
            RunAccount::try_serialize(&run, &mut writer)?;
        }
    }

    // deposit tokens
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        ctx.accounts.market.job_price,
    )?;

    // pay fee
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
        ctx.accounts.market.job_price / MarketAccount::JOB_FEE_FRACTION,
    )
}

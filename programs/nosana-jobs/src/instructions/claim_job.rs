use crate::*;
use anchor_spl::token::TokenAccount;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    #[account(mut)]
    pub jobs: Account<'info, Jobs>,
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Initialized as u8 @ NosanaError::JobNotInitialized
    )]
    pub job: Account<'info, Job>,
    #[account(
        address = Pubkey::find_program_address(
            &[ b"stake", id::NOS_TOKEN.as_ref(), authority.key().as_ref() ],
            &id::STAKING_PROGRAM
        ).0 @ NosanaError::StakeDoesNotMatchReward,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.to_account_info().lamports() != 0 @ NosanaError::StakeDoesNotExist,
        constraint = stake.amount >= 10_000 * constants::NOS_DECIMALS @ NosanaError::NodeUnqualifiedStakeAmount,
        constraint = stake.time_unstake == 0 @ NosanaError::NodeUnqualifiedUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        constraint = nft.owner == authority.key() @ NosanaError::Unauthorized,
        constraint = nft.amount == 1 @ NosanaError::NodeUnqualifiedStakeAmount,
    )]
    pub nft: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ClaimJob>) -> Result<()> {
    // get job and claim it
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );

    // get jobs and remove the job from the list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

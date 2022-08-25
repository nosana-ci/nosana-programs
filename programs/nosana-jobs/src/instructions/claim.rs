use crate::*;
use anchor_spl::token::TokenAccount;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub jobs: Account<'info, ProjectAccount>,
    #[account(
        mut,
        constraint = job.job_status == JobStatus::Initialized as u8 @ NosanaError::JobNotInitialized
    )]
    pub job: Account<'info, JobAccount>,
    #[account(
        address = utils::get_staking_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
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

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    // get job and claim it
    let job: &mut Account<JobAccount> = &mut ctx.accounts.job;
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );

    // get jobs and remove the job from the list
    let jobs: &mut Account<ProjectAccount> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

use crate::*;
// use anchor_spl::token::Mint;
use nosana_staking::StakeAccount;

#[derive(Accounts)]
pub struct ClaimJob<'info> {
    #[account(mut, owner = ID.key())]
    pub jobs: Account<'info, Jobs>,
    #[account(mut, owner = ID.key())]
    pub job: Account<'info, Job>,
    #[account(owner = staking::ID.key())]
    pub stake: Account<'info, StakeAccount>,
    // #[account(address = nos::ID)]
    // pub nft: Box<Account<'info, Mint>>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<ClaimJob>) -> Result<()> {
    // get job and check if it's initialized
    let job: &mut Account<Job> = &mut ctx.accounts.job;
    require!(
        job.job_status == JobStatus::Initialized as u8,
        NosanaError::JobNotInitialized
    );

    // verify node has enough stake
    let stake: &Account<StakeAccount> = &ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(
        stake.amount >= nos::STAKE_MINIMUM,
        NosanaError::NodeUnqualifiedStakeAmount
    );
    require!(
        stake.time_unstake == 0_i64,
        NosanaError::NodeUnqualifiedUnstaked
    );

    // claim
    job.claim(
        *ctx.accounts.authority.key,
        ctx.accounts.clock.unix_timestamp,
    );

    // get jobs and remove the job from the list
    let jobs: &mut Account<Jobs> = &mut ctx.accounts.jobs;
    return jobs.remove_job(job.to_account_info().key);
}

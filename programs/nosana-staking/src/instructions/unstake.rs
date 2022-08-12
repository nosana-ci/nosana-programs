use crate::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake == 0 @ NosanaError::StakeAlreadyUnstaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    /// CHECK: we only want to verify this account does not exist
    #[account(owner = id::SYSTEM_PROGRAM.key())]
    pub reward: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    // get stake account, and unstake stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    stake.unstake(Clock::get()?.unix_timestamp);

    // check that reward account does not exist
    require!(
        ctx.accounts.reward.to_account_info().lamports() == 0,
        NosanaError::StakeHasReward
    );

    // check that the reward account is the right PDA
    let (derived_reward, _reward_bump) = Pubkey::find_program_address(
        &[b"reward", ctx.accounts.authority.key().as_ref()],
        &id::REWARDS_PROGRAM.key(),
    );
    require!(
        ctx.accounts.reward.key() == derived_reward,
        NosanaError::StakeDoesNotMatchReward
    );

    Ok(())
}

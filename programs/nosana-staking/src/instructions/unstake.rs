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
    #[account(
        address = utils::get_reward_address(authority.key) @ NosanaError::StakeDoesNotMatchReward,
        constraint = utils::account_is_closed(&reward) @ NosanaError::StakeHasReward,
    )]
    pub reward: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    // get stake account, and unstake stake
    (&mut ctx.accounts.stake).unstake(Clock::get()?.unix_timestamp);
    Ok(())
}

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
        owner = id::SYSTEM_PROGRAM @ NosanaError::InvalidOwner,
        address = Pubkey::find_program_address(
            &[ b"reward", authority.key().as_ref() ],
            &id::REWARDS_PROGRAM
        ).0 @ NosanaError::StakeDoesNotMatchReward,
        constraint = reward.try_borrow_data().unwrap().len() == 0 @ NosanaError::StakeHasReward,
    )]
    pub reward: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    // get stake account, and unstake stake
    (&mut ctx.accounts.stake).unstake(Clock::get()?.unix_timestamp);
    Ok(())
}

use crate::*;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        has_one = authority @ NosanaError::Unauthorized,
        constraint = stake.time_unstake != 0 @ NosanaError::StakeAlreadyStaked,
    )]
    pub stake: Account<'info, StakeAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    // get stake account and restake stake
    ctx.accounts.stake.unstake(0);
    Ok(())
}

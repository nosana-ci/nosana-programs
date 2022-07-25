use crate::*;
use nosana_common::{nos, NosanaError};

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(
        mut,
        seeds = [ b"stake", nos::ID.key().as_ref(), authority.key().as_ref() ],
        bump = stake.bump
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"stats", nos::ID.key().as_ref() ], bump = stats.bump)]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    // get and check the stake
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(stake.time_unstake != 0_i64, NosanaError::StakeAlreadyStaked);

    // reset the unstake clock
    stake.unstake(0);

    // re-add xnos to stats
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.add(utils::calculate_xnos(0, 0, stake.amount, stake.duration));

    // finish
    Ok(())
}

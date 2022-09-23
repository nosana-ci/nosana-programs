use crate::*;

#[derive(Accounts)]
pub struct Exit<'info> {
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Exit>) -> Result<()> {
    // exit the queue
    ctx.accounts.market.exit(ctx.accounts.authority.key)?;
    Ok(())
}

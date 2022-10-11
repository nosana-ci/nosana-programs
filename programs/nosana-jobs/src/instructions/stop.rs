use crate::*;

#[derive(Accounts)]
pub struct Stop<'info> {
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Stop>) -> Result<()> {
    ctx.accounts
        .market
        .remove_from_queue(ctx.accounts.authority.key);
    Ok(())
}

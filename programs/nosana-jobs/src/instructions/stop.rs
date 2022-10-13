use crate::*;

#[derive(Accounts)]
pub struct Stop<'info> {
    #[account(mut)]
    pub market: Account<'info, MarketAccount>,
    pub authority: Signer<'info>,
}

impl<'info> Stop<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.market.remove_from_queue(self.authority.key)
    }
}

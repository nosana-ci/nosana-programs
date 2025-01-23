use crate::*;

#[derive(Accounts)]
pub struct Stop<'info> {
    #[account(
        mut,
        constraint = market.queue_type == QueueType::Node as u8 @ NosanaJobsError::MarketInWrongState,
        constraint = market.authority == authority.key() || node.key() == authority.key()
            @ NosanaError::Unauthorized
    )]
    pub market: Account<'info, MarketAccount>,
    /// CHECK: this is the node to be removed from the queue
    pub node: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

impl<'info> Stop<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.market.remove_from_queue(self.node.key)
    }
}

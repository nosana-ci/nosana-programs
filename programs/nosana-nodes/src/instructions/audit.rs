use crate::*;

#[derive(Accounts)]
pub struct Audit<'info> {
    #[account(mut)]
    pub node: Account<'info, NodeAccount>,
    #[account(address = id::AUTHORITY @ NosanaError::Unauthorized)]
    pub authority: Signer<'info>,
}

impl<'info> Audit<'info> {
    pub fn handler(&mut self, audited: bool) -> Result<()> {
        self.node.audit(audited)
    }
}

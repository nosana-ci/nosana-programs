use crate::*;

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Update<'info> {
    pub fn handler(&mut self) -> Result<()> {
        Ok(())
    }
}

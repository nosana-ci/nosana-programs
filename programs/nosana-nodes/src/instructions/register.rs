use crate::*;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> Register<'info> {
    pub fn handler(&mut self) -> Result<()> {
        Ok(())
    }
}

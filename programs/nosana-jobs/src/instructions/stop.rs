use crate::*;

#[derive(Accounts)]
pub struct Stop<'info> {
    #[account(mut, has_one = authority @ NosanaError::Unauthorized, close = authority)]
    pub project: Account<'info, ProjectAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler() -> Result<()> {
    Ok(())
}

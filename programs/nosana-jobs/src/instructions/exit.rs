use crate::*;

#[derive(Accounts)]
pub struct Exit<'info> {
    #[account(mut)]
    pub nodes: Account<'info, NodesAccount>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Exit>) -> Result<()> {
    // exit the queue
    ctx.accounts.nodes.exit(ctx.accounts.authority.key)?;
    Ok(())
}

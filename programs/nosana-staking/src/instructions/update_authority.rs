use crate::*;

#[derive(Accounts)]
pub struct UpdateSlashAuthority<'info> {
    #[account(mut, has_one = authority)]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub authority: Signer<'info>,
    pub new_authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateSlashAuthority>) -> Result<()> {
    // get stats account and update authority
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    stats.update_authority(*ctx.accounts.new_authority.key);

    // finish
    Ok(())
}

use crate::*;

use nosana_common::{nos, NosanaError};

#[derive(Accounts)]
pub struct UpdateSlashAuthority<'info> {
    #[account(mut, seeds = [ b"stats", nos::ID.key().as_ref() ], bump = stats.bump)]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub new_authority: Signer<'info>,
    pub old_authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateSlashAuthority>) -> Result<()> {
    // get stats account and verify slash authority
    let stats: &mut Box<Account<StatsAccount>> = &mut ctx.accounts.stats;
    require!(
        stats.slash_authority == *ctx.accounts.old_authority.key,
        NosanaError::Unauthorized
    );
    stats.update_slash_authority(*ctx.accounts.new_authority.key);

    // finish
    Ok(())
}

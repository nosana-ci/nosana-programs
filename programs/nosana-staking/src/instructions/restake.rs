use crate::*;

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(mut, seeds = [ b"stake", authority.key().as_ref() ], bump)]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, seeds = [ b"xnos", nos::ID.key().as_ref() ], bump)]
    pub xnos_vault: Box<Account<'info, VaultAccount>>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<Restake>) -> Result<()> {
    let stake: &mut Account<StakeAccount> = &mut ctx.accounts.stake;
    require!(
        stake.authority == *ctx.accounts.authority.key,
        NosanaError::Unauthorized
    );
    require!(stake.time_unstake != 0_i64, NosanaError::StakeAlreadyStaked);

    // NULL time for unstake
    stake.unstake(0);

    let xnos_vault = &mut ctx.accounts.xnos_vault;
    xnos_vault.add(utils::calculate_xnos(0, 0, stake.amount, stake.duration));

    // finish
    Ok(())
}

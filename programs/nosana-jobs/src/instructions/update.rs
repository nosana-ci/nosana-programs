use crate::*;

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, has_one = authority @ NosanaError::InvalidVault)]
    pub market: Account<'info, MarketAccount>,
    /// CHECK: Only the account address is needed for an access key
    pub access_key: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<Update>,
    job_expiration: i64,
    job_price: u64,
    job_timeout: i64,
    job_type: u8,
    node_stake_minimum: u64,
) -> Result<()> {
    ctx.accounts.market.update(
        job_expiration,
        job_price,
        job_timeout,
        job_type,
        ctx.accounts.access_key.key(),
        node_stake_minimum,
    );
    Ok(())
}

use crate::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(address = id::NOS_TOKEN @ NosanaError::InvalidMint)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault,
        seeds = [ constants::PREFIX_VAULT.as_ref(), mint.key().as_ref(), authority.key().as_ref() ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        space = StakeAccount::SIZE,
        seeds = [ constants::PREFIX_STAKE.as_ref(), mint.key().as_ref(), authority.key().as_ref() ],
        bump,
    )]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
    // test duration and amount
    require!(duration >= DURATION_MIN, NosanaError::StakeDurationTooShort);
    require!(duration <= DURATION_MAX, NosanaError::StakeDurationTooLong);
    require!(amount >= STAKE_MINIMUM, NosanaError::StakeAmountNotEnough);

    // get stake account and init stake
    (&mut ctx.accounts.stake).init(
        amount,
        *ctx.accounts.authority.key,
        u64::try_from(duration).unwrap(),
        *ctx.accounts.vault.to_account_info().key,
        *ctx.bumps.get("vault").unwrap(),
    );

    // transfer tokens to the vault
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )
}

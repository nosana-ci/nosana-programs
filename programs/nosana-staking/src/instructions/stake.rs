use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

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

impl<'info> Stake<'info> {
    pub fn handler(&mut self, amount: u64, duration: u128, vault_bump: u8) -> Result<()> {
        // test duration and amount
        require!(
            duration >= DURATION_MIN,
            NosanaStakingError::DurationTooShort
        );
        require!(
            duration <= DURATION_MAX,
            NosanaStakingError::DurationTooLong
        );
        require!(amount >= STAKE_MINIMUM, NosanaStakingError::AmountNotEnough);

        // get stake account and init stake
        self.stake.init(
            amount,
            self.authority.key(),
            u64::try_from(duration).unwrap(),
            self.vault.key(),
            vault_bump,
        );

        // transfer tokens to the vault
        transfer_tokens_to_vault!(self, amount)
    }
}

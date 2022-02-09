use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[cfg(feature = "prd")]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7";
    pub const REWARD_PUBLIC_KEY: &str = "TBD";
}
#[cfg(not(feature = "prd"))]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp";
    pub const REWARD_PUBLIC_KEY: &str = "test65Hm1uoXA4C7BgiWddh9PHUTvgmKPVXAn13fvHy";
}

#[derive(Accounts)]
#[instruction(_nonce: u8)]
pub struct Initialize<'info> {
    #[account(
        address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub tokens: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = initializer,
        token::mint = tokens,
        token::authority = vault,
        seeds = [ constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap().as_ref() ],
        bump = _nonce,
    )]
    /// the not-yet-created, derived token vault public key
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    /// required
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Stake<'info> {
    #[account(
        address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub tokens: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = constants::REWARD_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub reward: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ tokens.key().as_ref() ],
        bump = nonce,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub from: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub to: Box<Account<'info, TokenAccount>>,

    pub from_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmitPrice<'info> {
    #[account(
        address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub tokens: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = constants::REWARD_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub reward: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ tokens.key().as_ref() ],
        bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
}

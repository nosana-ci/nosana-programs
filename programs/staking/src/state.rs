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
#[instruction(bump: u8)]
pub struct User<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub nos: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        token::mint = nos,
        token::authority = vault,
        seeds = [ constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap().as_ref() ],
        bump = bump,
    )]
    /// the not-yet-created, derived token vault public key
    pub vault: Box<Account<'info, TokenAccount>>,

    /// required
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Job<'info> {

    pub owner: Signer<'info>,

    #[account(
        address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap(),
    )]
    pub nos: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [ nos.key().as_ref() ],
        bump = bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub nos_from: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub nos_to: Box<Account<'info, TokenAccount>>,

    /// required
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

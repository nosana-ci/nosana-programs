use std::vec;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use borsh::{BorshDeserialize, BorshSerialize};

#[cfg(feature = "prd")]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7";
}
#[cfg(not(feature = "prd"))]
pub mod constants {
    pub const TOKEN_PUBLIC_KEY: &str = "testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp";
}

#[repr(u8)]
pub enum JobStatus {
    Created,
    Claimed,
    // Errored,
    Finished,
}

#[derive(Default, BorshSerialize, BorshDeserialize)]
pub struct Job {
    pub job_status: u8,
    pub ipfs_link: u8,
}

impl Job {
    pub fn new(job_status: JobStatus, ipfs_link: u8) -> Self {
        Self { job_status: job_status as u8, ipfs_link }
    }
}

#[account]
pub struct Jobs {
    pub payer: Pubkey,
    pub jobs: Vec<u8>,
}

impl Jobs {
    pub fn new(payer: Pubkey) -> Self {
        Self { payer, jobs: Vec::new() }
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {

    pub authority: Signer<'info>,

    #[account(address = constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap())]
    pub nos: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = authority,
        token::mint = nos,
        token::authority = vault,
        seeds = [ constants::TOKEN_PUBLIC_KEY.parse::<Pubkey>().unwrap().as_ref() ],
        bump = bump,
    )]
    /// the not-yet-Created, derived token vault public key
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = authority,
        space = 48
    )]
    pub jobs: Account<'info, Jobs>,

    /// required
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Projects<'info> {

    pub payer: Signer<'info>,

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

    /// required
    pub token_program: Program<'info, Token>,
}

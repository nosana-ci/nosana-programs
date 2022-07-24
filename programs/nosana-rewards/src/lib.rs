mod utils;

use anchor_lang::prelude::*;
use anchor_lang::declare_id;
use anchor_spl::token::{Mint, Token, TokenAccount};
use nosana_staking::program::NosanaStaking;
use nosana_staking::StakeAccount;

declare_id!("8Ca1NWKayrZxiDhmLQyxZnBTCqGRb6V39yiKiKNRfQy1");

// TODO: this is a magic number based on SafeMoon. should be as large as we can
// go without reaching an overflow in the arithmatics
pub const INITIAL_RATE : u128 = 12736648300;

pub mod nos {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("TSTntXiYheDFtAdQ1pNBM2QQncA22PCFLLRr53uBa8i");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");

    pub const DECIMALS: u128 = 1_000_000;
}

#[error_code]
pub enum NosanaError {
    AlreadyUnstaked,
    StakeDecreased
}

#[program]
pub mod nosana_rewards {
    use super::*;

    pub fn init(ctx: Context<Init>) -> Result<()> {
        let stats = &mut ctx.accounts.stats;
        stats.bump = *ctx.bumps.get("stats").unwrap();
        stats.r_total = 0;
        stats.t_total = 0;
        stats.rate = INITIAL_RATE;
        Ok(())
    }

    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        let stake = &ctx.accounts.stake;
        let stats = &mut ctx.accounts.stats;

        let reward = &mut ctx.accounts.reward;
        reward.bump = *ctx.bumps.get("reward").unwrap();
        reward.authority = *ctx.accounts.authority.key;

        require!(stake.time_unstake == 0, NosanaError::AlreadyUnstaked);

        // TODO: tnos should be based on xnos instead of amount
        let tnos: u128 = u128::from(stake.amount);
        let rnos: u128 = stats.tokens_to_reflection(tnos);

        stats.r_total = stats.r_total.checked_add(rnos).unwrap();
        stats.t_total = stats.t_total.checked_add(tnos).unwrap();
        stats.update_rate();

        reward.t_owned = tnos;
        reward.r_owned = rnos;

        Ok(())
    }

    pub fn add_fee(ctx: Context<AddFee>, amount: u64) -> Result<()> {
        utils::transfer_tokens(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.ata_from.to_account_info(),
            ctx.accounts.ata_vault.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            0, // signature provided, no need to sign with PDA
            amount,
        )?;

        let stats = &mut ctx.accounts.stats;
        let tamount = u128::from(amount);
        stats.t_total = stats.t_total.checked_add(tamount).unwrap();
        stats.update_rate();

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let stats = &mut ctx.accounts.stats;
        let stake = &ctx.accounts.stake;
        let reward = &mut ctx.accounts.reward;
        let bump: u8 =  *ctx.bumps.get("ata_vault").unwrap();

        // check that the stake is still active, and that the stake has
        // not not decreased.
        // TODO: use xNOS instead of stake.amount
        require!(stake.time_unstake == 0, NosanaError::AlreadyUnstaked);
        require!(u128::from(stake.amount) >= reward.t_owned, NosanaError::StakeDecreased);

        let rowned: u128 = stats.tokens_to_reflection(reward.t_owned);
        let towed: u128 = reward.r_owned.checked_div(stats.rate).unwrap();
        let earned_fees: u128 = towed.checked_sub(reward.t_owned).unwrap();

        stats.r_total = stats.r_total.checked_sub(reward.r_owned).unwrap();
        stats.t_total = stats.t_total
            .checked_sub(reward.t_owned)
            .unwrap()
            .checked_sub(earned_fees)
            .unwrap();

        stats.update_rate();

        let reward_amount: u64 = u64::try_from(earned_fees).ok().unwrap();

        utils::transfer_tokens(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.ata_vault.to_account_info(),
            ctx.accounts.ata_to.to_account_info(),
            ctx.accounts.ata_vault.to_account_info(),
            bump, // we're signing the vault PDA
            reward_amount
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(address = nos::ID)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = ata_vault,
        seeds = [ nos::ID.key().as_ref() ],
        bump,
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = authority,
        space = STATS_SIZE,
        seeds = [ b"stats" ],
        bump,
    )]
    pub stats: Box<Account<'info, StatsAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut, owner=ID.key(), seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(owner = staking_program.key())]
    pub stake: Account<'info, StakeAccount>,
    #[account(
        init,
        payer = authority,
        space = REWARD_SIZE,
        seeds = [ b"reward", authority.key().as_ref()],
        bump,
    )]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub staking_program: Program<'info, NosanaStaking>,
}

#[derive(Accounts)]
pub struct AddFee<'info> {
    #[account(mut, owner=ID.key(), seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_from: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [ b"stats" ], bump = stats.bump)]
    pub stats: Account<'info, StatsAccount>,
    #[account(mut, seeds = [ nos::ID.key().as_ref() ], bump)]
    pub ata_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub ata_to: Box<Account<'info, TokenAccount>>,
    #[account(owner = staking_program.key())]
    pub stake: Account<'info, StakeAccount>,
    #[account(mut, close = authority, seeds = [ b"reward", authority.key().as_ref()], bump)]
    pub reward: Box<Account<'info, RewardAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub staking_program: Program<'info, NosanaStaking>,
}

pub const STATS_SIZE: usize = 8 + std::mem::size_of::<StatsAccount>();

#[account]
pub struct StatsAccount {
    pub r_total: u128,
    pub t_total: u128,
    pub rate: u128,
    pub bump: u8,
}

impl StatsAccount {
    pub fn update_rate(&mut self) {
        if self.t_total == 0 {
            self.rate = INITIAL_RATE;
        } else {
            self.rate = self.r_total.checked_div(self.t_total).unwrap();
        }
    }

    pub fn tokens_to_reflection(&mut self, tokens: u128) -> u128 {
        return tokens.checked_mul(self.rate).unwrap();
    }
}

pub const REWARD_SIZE: usize = 8 + std::mem::size_of::<RewardAccount>();

#[account]
pub struct RewardAccount {
    pub r_owned: u128,
    pub t_owned: u128,
    pub authority: Pubkey,
    pub bump: u8,
}

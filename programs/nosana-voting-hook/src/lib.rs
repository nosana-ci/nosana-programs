use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use std::str::FromStr;

entrypoint!(process_instruction);

// ATAs!
const YES_VOTE: Pubkey = solana_program::pubkey!("DaEBbLsd3VPUtKihFnvtCf2WvKCLHKJ3g8C4RemtBB1E");
const NO_VOTE: Pubkey = solana_program::pubkey!("DaEBbLsd3VPUtKihFnvtCf2WvKCLHKJ3g8C4RemtBB1E");

// January 1, 2026 00:00:00 UTC = 1735689600
const TRANSFER_DEADLINE: i64 = 1735689600;

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let _source = next_account_info(account_info_iter)?;
    let _mint = next_account_info(account_info_iter)?;
    let destination = next_account_info(account_info_iter)?;
    let _authority = next_account_info(account_info_iter)?;
    
    let clock = Clock::get()?;
    if clock.unix_timestamp >= TRANSFER_DEADLINE {
        msg!("Transfer denied: deadline passed");
        msg!("Current time: {}, Deadline: {}", clock.unix_timestamp, TRANSFER_DEADLINE);
        return Err(ProgramError::Custom(1));
    }

    if destination.key != &YES_VOTE && destination.key != &NO_VOTE {
        msg!("Transfer denied: only VOTE transfers to allowed");
        msg!("Attempted transfer to: {}", destination.key);
        return Err(ProgramError::InvalidArgument);
    }
    Ok(())
}

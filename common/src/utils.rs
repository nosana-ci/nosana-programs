use crate::{
    constants::{PREFIX_REWARDS, PREFIX_STAKE},
    id,
};
use anchor_lang::{__private::CLOSED_ACCOUNT_DISCRIMINATOR, prelude::*};

pub fn get_address(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(seeds, program_id).0
}

pub fn get_reward_address(authority: &Pubkey) -> Pubkey {
    get_address(
        &[PREFIX_REWARDS.as_ref(), authority.as_ref()],
        &id::REWARDS_PROGRAM,
    )
}

pub fn get_staking_address(authority: &Pubkey) -> Pubkey {
    get_address(
        &[
            PREFIX_STAKE.as_ref(),
            id::NOS_TOKEN.as_ref(),
            authority.as_ref(),
        ],
        &id::STAKING_PROGRAM,
    )
}

pub fn account_is_closed(account: &AccountInfo) -> bool {
    account.owner == &id::SYSTEM_PROGRAM
        || account.try_borrow_data().unwrap()[..8] == CLOSED_ACCOUNT_DISCRIMINATOR
}

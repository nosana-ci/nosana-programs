use crate::{constants, id};
use anchor_lang::prelude::*;

/***
 * Program Derived Addresses
 */

fn get_address(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(seeds, program_id).0
}

pub fn nosana_rewards(authority: &Pubkey) -> Pubkey {
    get_address(
        &[constants::PREFIX_REWARDS.as_ref(), authority.as_ref()],
        &id::REWARDS_PROGRAM,
    )
}

pub fn nosana_staking(authority: &Pubkey) -> Pubkey {
    get_address(
        &[
            constants::PREFIX_STAKE.as_ref(),
            id::NOS_TOKEN.as_ref(),
            authority.as_ref(),
        ],
        &id::STAKING_PROGRAM,
    )
}

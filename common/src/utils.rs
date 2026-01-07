use crate::id;
use anchor_lang::prelude::*;

/// Closed account discriminator (all 0xFF bytes)
const CLOSED_ACCOUNT_DISCRIMINATOR: [u8; 8] = [0xff; 8];

/***
 * Utilities
 */

pub fn account_is_closed(account: &AccountInfo) -> bool {
    account.owner == &id::SYSTEM_PROGRAM
        || account.try_borrow_data().unwrap()[..8] == CLOSED_ACCOUNT_DISCRIMINATOR
}

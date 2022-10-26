use crate::id;
use anchor_lang::{__private::CLOSED_ACCOUNT_DISCRIMINATOR, prelude::*};

/***
 * Utilities
 */

pub fn account_is_closed(account: &AccountInfo) -> bool {
    account.owner == &id::SYSTEM_PROGRAM
        || account.try_borrow_data().unwrap()[..8] == CLOSED_ACCOUNT_DISCRIMINATOR
}

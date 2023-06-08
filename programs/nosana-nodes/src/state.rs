use anchor_lang::prelude::*;

/***
 * Accounts
 */

/// The `NodeAccount` struct holds all the information for any given node.
#[account]
pub struct NodeAccount {
    pub icon: Pubkey,
}

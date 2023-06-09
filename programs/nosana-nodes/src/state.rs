use anchor_lang::prelude::*;
use std::mem::size_of;

/***
 * Accounts
 */

/// The `NodeAccount` struct holds all the information for any given node.
#[account]
pub struct NodeAccount {
    pub endpoint: String,
    pub location: String,
    pub version: String,
    pub icon: Pubkey,
    pub memory: u16,
    pub storage: u16,
    pub iops: u16,
    pub vcpu: u16,
    pub vgpu: u16,
    pub arch: u8,
}

impl NodeAccount {
    pub const SIZE: usize = 8 + size_of::<NodeAccount>();
}

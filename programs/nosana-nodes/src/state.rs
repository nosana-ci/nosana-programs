use anchor_lang::prelude::*;
use std::mem::size_of;

/***
 * Accounts
 */

/// The `NodeAccount` struct holds all the information for any given node.
#[account]
pub struct NodeAccount {
    pub authority: Pubkey,
    pub architecture: u8,
    pub cpu: u16,
    pub gpu: u16,
    pub memory: u16,
    pub iops: u16,
    pub storage: u16,
    pub icon: Pubkey,
    pub endpoint: String,
    pub location: String,
    pub version: String,
}

impl NodeAccount {
    pub const SIZE: usize = 8 + size_of::<NodeAccount>();

    pub fn register(
        &mut self,
        authority: Pubkey,
        architecture: u8,
        cpu: u16,
        gpu: u16,
        memory: u16,
        iops: u16,
        storage: u16,
        icon: Pubkey,
        endpoint: String,
        location: String,
        version: String,
    ) -> Result<()> {
        self.authority = authority;
        self.architecture = architecture;
        self.cpu = cpu;
        self.gpu = gpu;
        self.memory = memory;
        self.iops = iops;
        self.storage = storage;
        self.icon = icon;
        self.endpoint = endpoint;
        self.location = location;
        self.version = version;
        Ok(())
    }
}

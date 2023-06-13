use crate::{ArchitectureType, CountryCode, NosanaNodesError};
use anchor_lang::prelude::*;
use std::mem::size_of;

/***
 * Accounts
 */

/// The `NodeAccount` struct holds all the information for any given node.
#[account]
pub struct NodeAccount {
    pub authority: Pubkey,
    pub audited: bool,
    pub architecture: u8,
    pub country: u16,
    pub cpu: u16,
    pub gpu: u16,
    pub memory: u16,
    pub iops: u16,
    pub storage: u16,
    pub icon: Pubkey,
    pub endpoint: String,
    pub version: String,
}

impl NodeAccount {
    pub const SIZE: usize = 8 + size_of::<NodeAccount>();

    pub fn register(&mut self, authority: Pubkey) -> Result<()> {
        self.authority = authority;
        Ok(())
    }

    pub fn audit(&mut self, audited: bool) -> Result<()> {
        self.audited = audited;
        Ok(())
    }

    pub fn update(
        &mut self,
        architecture: u8,
        country: u16,
        cpu: u16,
        gpu: u16,
        memory: u16,
        iops: u16,
        storage: u16,
        icon: Pubkey,
        endpoint: String,
        version: String,
    ) -> Result<()> {
        require_neq!(
            ArchitectureType::from(architecture) as u8,
            ArchitectureType::Unknown as u8,
            NosanaNodesError::ArchitectureUnknown
        );
        require_neq!(
            CountryCode::from(country) as u8,
            CountryCode::Unknown as u8,
            NosanaNodesError::CountryCodeUnknown
        );
        require_gt!(cpu, 0, NosanaNodesError::CpuInvalid);
        require_gte!(gpu, 0, NosanaNodesError::GpuInvalid);
        require_gt!(memory, 0, NosanaNodesError::MemoryInvalid);
        require_gt!(iops, 0, NosanaNodesError::IopsInvalid);
        require_gt!(storage, 0, NosanaNodesError::StorageInvalid);

        self.country = country;
        self.architecture = architecture;
        self.cpu = cpu;
        self.gpu = gpu;
        self.memory = memory;
        self.iops = iops;
        self.storage = storage;
        self.icon = icon;
        self.endpoint = endpoint;
        self.version = version;
        Ok(())
    }
}

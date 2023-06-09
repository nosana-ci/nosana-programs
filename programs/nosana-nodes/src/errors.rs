use anchor_lang::prelude::*;

/***
 * Errors
 */

#[error_code]
pub enum NosanaNodesError {
    #[msg("This architecture does not exist.")]
    ArchitectureUnknown,
    #[msg("This country does not exist.")]
    CountryCodeUnknown,
    #[msg("CPU value must be greater than zero")]
    CpuInvalid,
    #[msg("GPU value must be greater than zero")]
    GpuInvalid,
    #[msg("Memory value must be greater than zero")]
    MemoryInvalid,
    #[msg("IOPS value must be greater than zero")]
    IopsInvalid,
    #[msg("Storage value must be greater than zero")]
    StorageInvalid,
}

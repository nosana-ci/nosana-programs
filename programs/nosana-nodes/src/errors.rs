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
    CpuNull,
    #[msg("GPU value must be greater than zero")]
    GpuNull,
    #[msg("Memory value must be greater than zero")]
    MemoryNull,
    #[msg("IOPS value must be greater than zero")]
    IopsNull,
    #[msg("Storage value must be greater than zero")]
    StorageNull,
}

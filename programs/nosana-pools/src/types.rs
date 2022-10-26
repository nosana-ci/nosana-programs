/***
 * Types
 */

/// The `ClaimType` of any pool describes the way withdraw ([claim](#claim)) works.
#[repr(u8)]
pub enum ClaimType {
    Transfer = 0,
    AddFee = 1,
    Unknown = 255,
}

impl From<u8> for ClaimType {
    fn from(job_type: u8) -> Self {
        match job_type {
            0 => ClaimType::Transfer,
            1 => ClaimType::AddFee,
            _ => ClaimType::Unknown,
        }
    }
}

//! Instructions for Nosana Rewards.

pub mod claim_fee;
pub mod claim_transfer;
pub mod close;
pub mod open;
pub mod update_beneficiary;

pub use claim_fee::*;
pub use claim_transfer::*;
pub use close::*;
pub use open::*;
pub use update_beneficiary::*;

//! Instructions for Nosana Staking.

pub mod claim;
pub mod extend;
pub mod init_vault;
pub mod restake;
pub mod slash;
pub mod stake;
pub mod topup;
pub mod unstake;
pub mod update_slash_authority;

pub use claim::*;
pub use extend::*;
pub use init_vault::*;
pub use restake::*;
pub use slash::*;
pub use stake::*;
pub use topup::*;
pub use unstake::*;
pub use update_slash_authority::*;

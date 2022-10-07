//! Instructions for Nosana Jobs.

pub mod claim;
pub mod clean;
pub mod close;
pub mod finish;
pub mod list;
pub mod open;
pub mod quit;
pub mod recover;
pub mod stop;
pub mod update;
pub mod work;

pub use claim::*;
pub use clean::*;
pub use close::*;
pub use finish::*;
pub use list::*;
pub use open::*;
pub use quit::*;
pub use recover::*;
pub use stop::*;
pub use update::*;
pub use work::*;

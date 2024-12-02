//! Instructions for Nosana Jobs.

pub mod claim;
pub mod clean;
pub mod clean_admin;
pub mod close;
pub mod close_admin;
pub mod delist;
pub mod end;
pub mod extend;
pub mod finish;
pub mod list;
pub mod open;
pub mod quit;
pub mod quit_admin;
pub mod recover;
pub mod stop;
pub mod update;
pub mod work;

pub use claim::*;
pub use clean::*;
pub use clean_admin::*;
pub use close::*;
pub use close_admin::*;
pub use delist::*;
pub use end::*;
pub use extend::*;
pub use finish::*;
pub use list::*;
pub use open::*;
pub use quit::*;
pub use quit_admin::*;
pub use recover::*;
pub use stop::*;
pub use update::*;
pub use work::*;

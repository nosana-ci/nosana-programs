mod error;
mod ids;
mod utils;

pub use error::*;
pub use ids::*;
pub use utils::*;

use anchor_lang::prelude::*;

declare_id!(common::ID);

#[program]
pub mod nosana_common {}

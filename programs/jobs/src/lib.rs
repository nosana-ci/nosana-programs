use anchor_lang::prelude::*;

#[cfg(feature = "prd")]
declare_id!("TBD");
#[cfg(not(feature = "prd"))]
declare_id!("testTfjx9bNFDdHQpk5iapa6YHkdRVhLT3cYkS2nVav");

#[program]
pub mod jobs {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

use crate::instructions::CreateJob;

/// # Cross program invocations
/// These methods provide context for invoking both the native token,
/// as well as the reward token.

/// Function to get cross-program-invocations context for transfer
pub fn ctx_create_job<'a, 'b, 'c, 'info>(
    job: &mut CreateJob<'info>,
) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
    return CpiContext::new(
        job.token_program.to_account_info(),
        token::Transfer {
            from: job.nos_from.to_account_info(),
            to: job.vault.to_account_info(),
            authority: job.authority.to_account_info(),
        },
    );
}

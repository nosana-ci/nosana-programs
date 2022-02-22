use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

use crate::state::Job;

/// # Cross program invocations
/// These methods provide context for invoking both the native token,
/// as well as the reward token.

/// Function to get cross-program-invocations context for transfer
pub fn ctx_create_job<'a, 'b, 'c, 'info>(
    job: &mut Job<'info>,
) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
    return CpiContext::new(
        job.token_program.to_account_info(),
        token::Transfer {
            from: job.nos_from.to_account_info(),
            to: job.vault.to_account_info(),
            authority: job.owner.to_account_info(),
        },
    );
}

/// Function to get cross-program-invocations context for transfer with signer
pub fn ctx_finnish_job<'a, 'b, 'c, 'info>(
    job: &mut Job<'info>,
    signer: &'a [&'b [&'c [u8]]],
) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
    return CpiContext::new_with_signer(
        job.token_program.to_account_info(),
        token::Transfer {
            from: job.vault.to_account_info(),
            to: job.nos_to.to_account_info(),
            authority: job.vault.to_account_info(),
        },
        signer,
    );
}

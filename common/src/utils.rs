use anchor_lang::prelude::*;
use anchor_spl::token;

pub fn transfer_tokens_with_seeds<'info>(
    program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    amount: u64,
    seeds: &[&[u8]],
) -> Result<()> {
    token::transfer(
        CpiContext::new_with_signer(
            program,
            token::Transfer {
                from,
                to,
                authority,
            },
            &[seeds],
        ),
        amount,
    )
}

pub fn transfer_tokens<'info>(
    program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    nonce: u8,
    amount: u64,
) -> Result<()> {
    if nonce == 0 {
        token::transfer(
            CpiContext::new(
                program,
                token::Transfer {
                    from,
                    to,
                    authority,
                },
            ),
            amount,
        )
    } else {
        transfer_tokens_with_seeds(
            program,
            from,
            to,
            authority,
            amount,
            &[crate::address::nos::ID.as_ref(), &[nonce]],
        )
    }
}

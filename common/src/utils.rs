use anchor_lang::prelude::*;
use anchor_spl::token;

pub fn transfer_tokens_with_seeds<'info>(
    program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    nonce: u8,
    amount: u64,
    seeds: &[&[u8]],
) -> Result<()> {
    let accounts = token::Transfer {
        from,
        to,
        authority,
    };

    if nonce == 0 {
        token::transfer(CpiContext::new(program, accounts), amount)
    } else {
        token::transfer(
            CpiContext::new_with_signer(program, accounts, &[seeds]),
            amount,
        )
    }
}

pub fn transfer_tokens<'info>(
    program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    nonce: u8,
    amount: u64,
) -> Result<()> {
    transfer_tokens_with_seeds(
        program,
        from,
        to,
        authority,
        nonce,
        amount,
        &[crate::ids::nos::ID.as_ref(), &[nonce]],
    )
}

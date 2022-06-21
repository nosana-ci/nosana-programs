use crate::state;
use anchor_lang::prelude::*;
use anchor_spl::token;

pub fn transfer_tokens<'info>(
    program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    nonce: u8,
    amount: u64,
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
            CpiContext::new_with_signer(
                program,
                accounts,
                &[&[crate::ids::nos::ID.as_ref(), &[nonce]]],
            ),
            amount,
        )
    }
}

pub fn calculate_xnos(time_current: i64, time_unstake: i64, amount: u64, duration: u128) -> u128 {
    // determine elapsed time in seconds since unstake, 0 if not unstaked
    let elapsed = u128::try_from(if time_unstake == 0 {
        0
    } else {
        time_current.checked_sub(time_unstake).unwrap()
    })
    .unwrap();

    // return boost in xnos
    duration
        .checked_sub(elapsed)
        .unwrap()
        .checked_mul(u128::from(amount))
        .unwrap()
        .checked_div(state::SECONDS_PER_MONTH)
        .unwrap()
}

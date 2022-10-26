use anchor_lang::prelude::*;
use anchor_lang::system_program::CreateAccount;
use anchor_spl::token::{CloseAccount, Transfer};

/***
 * Common Cross Program Invocations
 */

pub fn create_account<'info>(
    system_program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    space: usize,
    owner: &Pubkey,
) -> Result<()> {
    anchor_lang::system_program::create_account(
        CpiContext::new(system_program, CreateAccount { from, to }).with_signer(&[]),
        Rent::get()?.minimum_balance(space),
        space.try_into().unwrap(),
        owner,
    )
}

pub fn transfer_tokens<'info, 'a, 'b, 'c>(
    token_program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    signer_seeds: &'a [&'b [&'c [u8]]],
    amount: u64,
) -> Result<()> {
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            token_program,
            Transfer {
                from,
                to,
                authority,
            },
            signer_seeds,
        ),
        amount,
    )
}

pub fn close_token_account<'info, 'a, 'b, 'c>(
    token_program: AccountInfo<'info>,
    account: AccountInfo<'info>,
    destination: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    signer_seeds: &'a [&'b [&'c [u8]]],
) -> Result<()> {
    anchor_spl::token::close_account(CpiContext::new_with_signer(
        token_program,
        CloseAccount {
            account,
            destination,
            authority,
        },
        signer_seeds,
    ))
}

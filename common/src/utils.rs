use crate::id;
use anchor_lang::__private::CLOSED_ACCOUNT_DISCRIMINATOR;
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
            CpiContext::new_with_signer(program, accounts, &[&[id::NOS_TOKEN.as_ref(), &[nonce]]]),
            amount,
        )
    }
}

pub fn get_reward_address(authority: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"reward", authority.as_ref()], &id::REWARDS_PROGRAM).0
}

pub fn get_staking_address(authority: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[b"stake", id::NOS_TOKEN.as_ref(), authority.as_ref()],
        &id::STAKING_PROGRAM,
    )
    .0
}

pub fn account_is_closed(account: &AccountInfo) -> bool {
    account.owner == &id::SYSTEM_PROGRAM
        || account.try_borrow_data().unwrap()[..8] == CLOSED_ACCOUNT_DISCRIMINATOR
}

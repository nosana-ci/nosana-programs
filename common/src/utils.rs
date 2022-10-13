use crate::{
    constants::{PREFIX_REWARDS, PREFIX_STAKE},
    id,
};
use anchor_lang::system_program::CreateAccount;
use anchor_lang::{__private::CLOSED_ACCOUNT_DISCRIMINATOR, prelude::*};
use anchor_spl::token::{CloseAccount, Transfer};

pub fn get_address(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(seeds, program_id).0
}

pub fn get_reward_address(authority: &Pubkey) -> Pubkey {
    get_address(
        &[PREFIX_REWARDS.as_ref(), authority.as_ref()],
        &id::REWARDS_PROGRAM,
    )
}

pub fn get_staking_address(authority: &Pubkey) -> Pubkey {
    get_address(
        &[
            PREFIX_STAKE.as_ref(),
            id::NOS_TOKEN.as_ref(),
            authority.as_ref(),
        ],
        &id::STAKING_PROGRAM,
    )
}

pub fn account_is_closed(account: &AccountInfo) -> bool {
    account.owner == &id::SYSTEM_PROGRAM
        || account.try_borrow_data().unwrap()[..8] == CLOSED_ACCOUNT_DISCRIMINATOR
}

pub fn cpi_create_account<'info>(
    account: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    space: usize,
    owner: &Pubkey,
) -> Result<()> {
    anchor_lang::system_program::create_account(
        CpiContext::new(
            system_program,
            CreateAccount {
                from: payer,
                to: account,
            },
        )
        .with_signer(&[]),
        Rent::get()?.minimum_balance(space),
        space as u64,
        owner,
    )
}

pub fn cpi_transfer_tokens<'info, 'a, 'b, 'c>(
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
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

pub fn cpi_close_token_account<'info, 'a, 'b, 'c>(
    account: AccountInfo<'info>,
    destination: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
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

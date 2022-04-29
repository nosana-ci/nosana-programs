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

    return if nonce == 0 {
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
    };
}

pub fn get_price(vault: u64, reward: u64) -> (u64, String) {
    if reward == 0 {
        return (0, String::from("0"));
    }

    let price_uint = calculate_reward(vault, 1_000_000, reward);
    let price_float = (vault as f64) / (reward as f64);
    (price_uint, price_float.to_string())
}

pub fn calculate_reward(amount: u64, mul: u64, div: u64) -> u64 {
    (amount as u128)
        .checked_mul(mul as u128)
        .unwrap()
        .checked_div(div as u128)
        .unwrap()
        .try_into()
        .unwrap()
}

use crate::StakeTier::{Level0, Level1, Level2, Level3, Level4};
use crate::{
    StakeTier, LEVEL0_MAX, LEVEL0_MIN, LEVEL1_MAX, LEVEL1_MIN, LEVEL2_MAX, LEVEL2_MIN, LEVEL3_MAX,
    LEVEL3_MIN, LEVEL4_MAX, LEVEL4_MIN,
};
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

pub fn calculate_xnos(time: i64, time_unstake: i64, amount: u64, duration: u128) -> u128 {
    let elapsed = u128::try_from(if time_unstake == 0 {
        0
    } else {
        time.checked_sub(time_unstake).unwrap()
    })
    .unwrap();

    duration
        .checked_sub(elapsed)
        .unwrap()
        .checked_mul(u128::from(amount))
        .unwrap()
}

pub fn get_tier(xnos: u128) -> StakeTier {
    match xnos {
        LEVEL0_MIN..=LEVEL0_MAX => Level0,
        LEVEL1_MIN..=LEVEL1_MAX => Level1,
        LEVEL2_MIN..=LEVEL2_MAX => Level2,
        LEVEL3_MIN..=LEVEL3_MAX => Level3,
        LEVEL4_MIN..=LEVEL4_MAX => Level4,
    }
}

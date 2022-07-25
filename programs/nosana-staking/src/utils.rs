use crate::state;

pub fn calculate_xnos(time_current: i64, time_unstake: i64, amount: u64, duration: u128) -> u128 {
    // determine elapsed time in seconds since unstake, 0 if not unstaked
    let elapsed = u128::try_from(if time_unstake == 0 {
        0
    } else {
        time_current.checked_sub(time_unstake).unwrap()
    })
    .unwrap();

    // return boost in xnos
    if elapsed >= duration {
        0
    } else {
        duration
            .checked_sub(elapsed)
            .unwrap()
            .checked_mul(u128::from(amount))
            .unwrap()
            .checked_div(state::duration::SECONDS_PER_MONTH)
            .unwrap()
    }
}

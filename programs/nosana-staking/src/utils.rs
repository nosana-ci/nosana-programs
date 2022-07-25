use crate::state;

pub fn calculate_xnos(time_current: u64, time_unstake: u64, amount: u64, duration: u64) -> u128 {
    // determine elapsed time in seconds since unstake, 0 if not unstaked
    let elapsed = u128::try_from(if time_unstake == 0 {
        0
    } else {
        time_current.checked_sub(time_unstake).unwrap()
    })
    .unwrap();

    // return xnos
    if elapsed >= u128::from(duration) {
        0
    } else {
        u128::from(duration)
            .checked_sub(elapsed)
            .unwrap()
            .checked_mul(u128::from(amount))
            .unwrap()
            .checked_div(u128::from(state::constants::SECONDS_PER_MONTH))
            .unwrap()
    }
}

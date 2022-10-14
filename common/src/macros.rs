/***
 * Macros
 */

#[macro_export]
macro_rules! security_txt {
    ($($name:ident: $value:expr),*) => {
        #[cfg_attr(target_arch = "bpf", link_section = ".security.txt")]
        #[allow(dead_code)]
        #[no_mangle]
        pub static security_txt: &str = concat! {
            "=======BEGIN SECURITY.TXT V1=======\0",
            $(stringify!($name), "\0", $value, "\0",)*
            "=======END SECURITY.TXT V1=======\0"
        };
    };
}

#[macro_export]
macro_rules! transfer_tokens_to_vault {
    ($accounts: expr, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.user.to_account_info(),
            $accounts.vault.to_account_info(),
            $accounts.authority.to_account_info(),
            &[],
            $amount,
        )
    };
}

#[macro_export]
macro_rules! transfer_tokens_from_vault {
    ($accounts: expr, $to: ident, $seeds: expr, $amount: expr) => {
        cpi::transfer_tokens(
            $accounts.token_program.to_account_info(),
            $accounts.vault.to_account_info(),
            $accounts.$to.to_account_info(),
            $accounts.vault.to_account_info(),
            $seeds,
            $amount,
        )
    };
}

#[macro_export]
macro_rules! close_vault {
    ($accounts: expr, $seeds: expr) => {
        cpi::close_token_account(
            $accounts.token_program.to_account_info(),
            $accounts.vault.to_account_info(),
            $accounts.authority.to_account_info(),
            $accounts.vault.to_account_info(),
            $seeds,
        )
    };
}

#[macro_export]
macro_rules! transfer_fee {
    ($accounts: expr, $from: ident, $authority: ident, $seeds: expr, $amount: expr) => {
        nosana_rewards::cpi::add_fee(
            CpiContext::new_with_signer(
                $accounts.rewards_program.to_account_info(),
                AddFee {
                    user: $accounts.$from.to_account_info(),
                    reflection: $accounts.rewards_reflection.to_account_info(),
                    vault: $accounts.rewards_vault.to_account_info(),
                    authority: $accounts.$authority.to_account_info(),
                    token_program: $accounts.token_program.to_account_info(),
                },
                $seeds,
            ),
            $amount,
        )
    };
}

/***
 * Macros
 */

#[macro_export]
macro_rules! seeds {
    ($stake: expr, $vault: expr) => {
        &[&[
            constants::PREFIX_VAULT.as_ref(),
            $vault.mint.as_ref(),
            $stake.authority.as_ref(),
            &[$stake.vault_bump],
        ][..]][..]
    };
}

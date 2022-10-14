/***
 * Marcros
 */

#[macro_export]
macro_rules! seeds {
    ($market: expr, $vault: expr) => {
        &[&[
            $market.key().as_ref(),
            $vault.mint.as_ref(),
            &[$market.vault_bump],
        ][..]][..]
    };
}

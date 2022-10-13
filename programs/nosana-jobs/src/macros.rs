#[macro_export]
macro_rules! seeds {
    ($market: expr) => {
        &[&[
            $market.key().as_ref(),
            &id::NOS_TOKEN.as_ref(),
            &[$market.vault_bump],
        ][..]][..]
    };
}

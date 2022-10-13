#[macro_export]
macro_rules! seeds {
    ($pool: expr) => {
        &[&[
            constants::PREFIX_VAULT.as_ref(),
            $pool.key().as_ref(),
            &[$pool.vault_bump],
        ][..]][..]
    };
}

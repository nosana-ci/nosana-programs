//! Macros

/// Generates the signer seeds
#[macro_export]
macro_rules! nosana_seeds {
    ($seeds: expr) => {
        &[&[
            &$seeds.mint.to_bytes(),
            &[$seeds.bump],
        ]]
    };
}

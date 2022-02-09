macro_rules! gen_nos_signer_seeds {
    ($seeds: expr) => {
        &[&[&$seeds.mint.to_bytes(), &[$seeds.bump]]]
    };
}

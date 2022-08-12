use anchor_lang::declare_id;

pub use jobs::ID as JOBS;
mod jobs {
    use super::*;
    declare_id!("nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM");
}

pub use rewards::ID as REWARDS;
mod rewards {
    use super::*;
    declare_id!("nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp");
}

pub use staking::ID as STAKING;
mod staking {
    use super::*;
    declare_id!("nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE");
}

pub use nos::ID as NOS;
pub mod nos {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");

    pub const DECIMALS: u64 = 1_000_000;
}

pub use authority::ID as AUTHORITY;
mod authority {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("nosP9DVJQVuRqub7JLf3K5Z2pwx3612egECNqCueE9m");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("XXXxddiNnmoD2h2LbQYaL76Swi21MaQbtBbRynAdQL8");
}

pub use token_account::ID as TOKEN_ACCOUNT;
mod token_account {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("A9V8JkR5HihvFpHq1ZbwrpPAGBhsGfeWw5TVcUdGf2dg");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("HLtABkKqsUjb4ECPEnvad6HN7QYf6ANHahAeZQXrAGgV");
}

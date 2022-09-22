use anchor_lang::declare_id;

pub use system_program::ID as SYSTEM_PROGRAM;
mod system_program {
    use super::*;
    declare_id!("11111111111111111111111111111111");
}

pub use jobs_program::ID as JOBS_PROGRAM;
mod jobs_program {
    use super::*;
    declare_id!("nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM");
}

pub use rewards_program::ID as REWARDS_PROGRAM;
mod rewards_program {
    use super::*;
    declare_id!("nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp");
}

pub use staking_program::ID as STAKING_PROGRAM;
mod staking_program {
    use super::*;
    declare_id!("nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE");
}

pub use pools_program::ID as POOLS_PROGRAM;
mod pools_program {
    use super::*;
    declare_id!("nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD");
}

pub use nos_token::ID as NOS_TOKEN;
mod nos_token {
    use super::*;
    #[cfg(feature = "mainnet")]
    declare_id!("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");
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

pub use nft_collection::ID as NFT_COLLECTION;
mod nft_collection {
    use super::*;
    declare_id!("nftNgYSG5pbwL7kHeJ5NeDrX8c4KrG1CzWhEXT8RMJ3");
}

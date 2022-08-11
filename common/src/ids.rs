pub mod jobs {
    use anchor_lang::declare_id;
    declare_id!("nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM");
}

pub mod rewards {
    use anchor_lang::declare_id;
    declare_id!("nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp");
}

pub mod staking {
    use anchor_lang::declare_id;
    declare_id!("nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE");
}

pub mod nos {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");

    pub const DECIMALS: u64 = 1_000_000;
}

pub mod authority {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("nosP9DVJQVuRqub7JLf3K5Z2pwx3612egECNqCueE9m");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("XXXxddiNnmoD2h2LbQYaL76Swi21MaQbtBbRynAdQL8");
}

pub mod treasury {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("NosanarMxfrZbyCx5CotBVrzxiPcrnhj6ickpX9vRkB");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("NosanarMxfrZbyCx5CotBVrzxiPcrnhj6ickpX9vRkB");
}

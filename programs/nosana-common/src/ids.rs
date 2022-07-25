pub mod common {
    use anchor_lang::declare_id;
    declare_id!("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
}

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
    declare_id!("TSTntXiYheDFtAdQ1pNBM2QQncA22PCFLLRr53uBa8i");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");

    pub const DECIMALS: u64 = 1_000_000;
}

use anchor_lang::declare_id;

// program ID
declare_id!("nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM");

// token ID
pub mod nos {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("TSTntXiYheDFtAdQ1pNBM2QQncA22PCFLLRr53uBa8i");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");

    pub const DECIMALS: u64 = 1_000_000;
    pub const STAKE_MINIMUM: u64 = 1_000 * DECIMALS;
}

pub mod staking {
    use anchor_lang::declare_id;
    declare_id!("nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE");
}

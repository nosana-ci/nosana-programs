use anchor_lang::declare_id;

// program ID
declare_id!("nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE");

// mint ID
pub mod nos {
    use anchor_lang::declare_id;

    #[cfg(feature = "mainnet")]
    declare_id!("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");

    pub const DECIMALS: u128 = 1_000_000;
}

// jobs ID
pub mod jobs {
    use anchor_lang::declare_id;
    declare_id!("nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM");
}

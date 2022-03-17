use anchor_lang::declare_id;

// program ID
declare_id!("nosJwntQe4eEnFC2mCsY9J15qw7kRQCDqcjcPj6aPbR");

// token ID
pub mod nos {
    use anchor_lang::declare_id;
    #[cfg(feature = "mainnet")]
    declare_id!("TSTntXiYheDFtAdQ1pNBM2QQncA22PCFLLRr53uBa8i");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");
}

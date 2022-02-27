use anchor_lang::declare_id;

// program ID
declare_id!("nosJwntQe4eEnFC2mCsY9J15qw7kRQCDqcjcPj6aPbR");

pub mod nos_token {
    use anchor_lang::declare_id;
    #[cfg(feature = "mainnet")]
    declare_id!("nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7");
    #[cfg(not(feature = "mainnet"))]
    declare_id!("testsKbCqE8T1ndjY4kNmirvyxjajKvyp1QTDmdGwrp");
}

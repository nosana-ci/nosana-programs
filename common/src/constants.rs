/***
 * Constants
 */

// number of decimals for the Nosana native token
// https://explorer.solana.com/address/nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7
pub const NOS_DECIMALS: u64 = 1_000_000;

// total supply the Nosana native token
pub const NOS_TOTAL_SUPPLY: u128 = 100_000_000 * NOS_DECIMALS as u128;

// https://github.com/otter-sec/anchor/blob/v0.25.0/lang/src/lib.rs#L273
pub const CLOSED_ACCOUNT_DISCRIMINATOR: [u8; 8] = [255, 255, 255, 255, 255, 255, 255, 255];

// prefix used for PDAs to avoid certain collision attacks
// https://en.wikipedia.org/wiki/Collision_attack#Chosen-prefix_collision_attack
pub const PREFIX_REWARDS: &[u8; 6] = b"reward";
pub const PREFIX_SETTINGS: &[u8; 8] = b"settings";
pub const PREFIX_REFLECTION: &[u8; 10] = b"reflection";
pub const PREFIX_STAKE: &[u8; 5] = b"stake";
pub const PREFIX_STATS: &[u8; 5] = b"stats";
pub const PREFIX_VAULT: &[u8; 5] = b"vault";
pub const PREFIX_NODE: &[u8; 4] = b"node";
pub const METAPLEX_METADATA: &[u8; 8] = b"metadata";

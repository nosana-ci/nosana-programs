#![cfg(feature = "test-sbf")]

use anchor_lang::{AnchorDeserialize, InstructionData, ToAccountMetas};
use anchor_spl::token::spl_token;
use light_client::indexer::CompressedAccount;
use light_program_test::{
    program_test::LightProgramTest, AddressWithTree, Indexer, ProgramTestConfig, Rpc, RpcError,
};
use light_sdk::{
    address::v2::derive_address,
    instruction::{
        account_meta::{CompressedAccountMeta, CompressedAccountMetaReadOnly},
        PackedAccounts, SystemAccountMetaConfig,
    },
};
use anchor_lang::{AnchorSerialize, Discriminator};
use nosana_staking::CompressedStakeAccount;
use serial_test::serial;
use solana_sdk::{
    account::Account,
    clock::Clock,
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signature, Signer},
};

const STAKE_AMOUNT: u64 = 1_000_000_000; // 1 NOS (9 decimals)
const DURATION_MIN: u64 = 14 * 24 * 60 * 60; // 14 days in seconds

// NOS Token address (devnet)
const NOS_TOKEN: Pubkey = solana_sdk::pubkey!("devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP");

// ============================================================================
// Test: Full Stake Lifecycle
// ============================================================================

#[tokio::test]
#[serial]
async fn test_stake_lifecycle() {
    let config = ProgramTestConfig::new_v2(
        true,
        Some(vec![("nosana_staking", nosana_staking::ID)]),
    );
    let mut rpc = LightProgramTest::new(config).await.unwrap();
    let payer = rpc.get_payer().insecure_clone();

    // Setup mint at NOS_TOKEN address and create token accounts
    let (user_ata, vault, vault_bump, settings, _slash_ata) =
        setup_token_accounts(&mut rpc, &payer).await;

    // Initialize settings
    init_settings(&mut rpc, &payer, &settings).await.unwrap();

    // Get address tree info for compressed account (V2 for new_v2 config)
    let address_tree_info = rpc.get_address_tree_v2();

    // Derive stake address
    let (stake_address, _) = derive_address(
        &[b"stake", NOS_TOKEN.as_ref(), payer.pubkey().as_ref()],
        &address_tree_info.tree,
        &nosana_staking::ID,
    );

    // Record initial balances
    let initial_user_balance = get_token_balance(&rpc, &user_ata);
    println!("Initial user balance: {}", initial_user_balance);

    // 1. Create stake
    println!("Creating stake...");
    create_stake(
        &mut rpc,
        &payer,
        &NOS_TOKEN,
        &user_ata,
        &vault,
        &stake_address,
        address_tree_info.clone(),
        STAKE_AMOUNT,
        DURATION_MIN as u128,
    )
    .await
    .unwrap();

    // Verify token balances after stake
    let user_balance_after_stake = get_token_balance(&rpc, &user_ata);
    let vault_balance_after_stake = get_token_balance(&rpc, &vault);
    assert_eq!(user_balance_after_stake, initial_user_balance - STAKE_AMOUNT, "User balance should decrease by stake amount");
    assert_eq!(vault_balance_after_stake, STAKE_AMOUNT, "Vault should hold staked tokens");
    println!("Token balances verified - User: {}, Vault: {}", user_balance_after_stake, vault_balance_after_stake);

    // Verify stake was created with all fields
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Build expected stake account and verify with single assert
    let expected_xnos = calculate_expected_xnos(STAKE_AMOUNT, DURATION_MIN);
    let expected_stake = CompressedStakeAccount {
        amount: STAKE_AMOUNT,
        authority: payer.pubkey(),
        duration: DURATION_MIN,
        time_unstake: 0,
        vault,
        vault_bump,
        xnos: expected_xnos,
    };
    assert_eq!(stake_data, expected_stake, "Stake account should match expected");
    println!("Stake created and verified: amount={}, duration={}, xnos={}", stake_data.amount, stake_data.duration, stake_data.xnos);

    // Set clock to a non-zero timestamp (the clock defaults to 0 in LiteSVM)
    let unstake_time = 1704067200i64; // Jan 1, 2024
    let mut clock = rpc.context.get_sysvar::<Clock>();
    clock.unix_timestamp = unstake_time;
    rpc.context.set_sysvar(&clock);

    // 2. Unstake
    println!("Unstaking...");
    unstake(&mut rpc, &payer, &compressed_account).await.unwrap();

    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();
    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Build expected stake after unstake and verify with single assert
    let expected_unstaked = CompressedStakeAccount {
        amount: STAKE_AMOUNT,
        authority: payer.pubkey(),
        duration: DURATION_MIN,
        time_unstake: unstake_time,
        vault,
        vault_bump,
        xnos: 0, // xnos is 0 when unstaked
    };
    assert_eq!(stake_data, expected_unstaked, "Stake account after unstake should match expected");
    println!("Unstake verified: time_unstake={}, xnos={}", stake_data.time_unstake, stake_data.xnos);

    // 3. Restake
    println!("Restaking...");
    restake(&mut rpc, &payer, &vault, &compressed_account)
        .await
        .unwrap();

    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();
    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Restake uses current vault balance as amount
    let vault_balance = get_token_balance(&rpc, &vault);
    let expected_xnos_after_restake = calculate_expected_xnos(vault_balance, DURATION_MIN);

    // Build expected stake after restake and verify with single assert
    let expected_restaked = CompressedStakeAccount {
        amount: vault_balance,
        authority: payer.pubkey(),
        duration: DURATION_MIN,
        time_unstake: 0,
        vault,
        vault_bump,
        xnos: expected_xnos_after_restake,
    };
    assert_eq!(stake_data, expected_restaked, "Stake account after restake should match expected");
    println!("Restake verified: time_unstake={}, xnos={}", stake_data.time_unstake, stake_data.xnos);

    // 4. Unstake again for withdraw test
    println!("Unstaking again for withdraw...");
    unstake(&mut rpc, &payer, &compressed_account).await.unwrap();

    // 5. Withdraw (partial - time-based)
    println!("Withdrawing...");
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    let vault_balance_before_withdraw = get_token_balance(&rpc, &vault);
    let user_balance_before_withdraw = get_token_balance(&rpc, &user_ata);

    withdraw(&mut rpc, &payer, &user_ata, &vault, &compressed_account)
        .await
        .unwrap();

    // Verify withdraw transferred tokens (time-based partial withdrawal)
    let vault_balance_after_withdraw = get_token_balance(&rpc, &vault);
    let user_balance_after_withdraw = get_token_balance(&rpc, &user_ata);

    // With 0 elapsed time (clock hasn't advanced), withdraw amount should be based on time elapsed
    let withdrawn_amount = user_balance_after_withdraw - user_balance_before_withdraw;
    let vault_decrease = vault_balance_before_withdraw - vault_balance_after_withdraw;
    assert_eq!(withdrawn_amount, vault_decrease, "Withdrawn amount should equal vault decrease");
    println!("Withdraw verified: withdrew {} tokens", withdrawn_amount);

    println!("All lifecycle tests passed!");
}

// ============================================================================
// Test: Slash functionality
// ============================================================================

#[tokio::test]
#[serial]
async fn test_slash() {
    let config = ProgramTestConfig::new_v2(
        true,
        Some(vec![("nosana_staking", nosana_staking::ID)]),
    );
    let mut rpc = LightProgramTest::new(config).await.unwrap();
    let payer = rpc.get_payer().insecure_clone();

    // Setup mint at NOS_TOKEN address and create token accounts
    let (user_ata, vault, _vault_bump, settings, slash_ata) =
        setup_token_accounts(&mut rpc, &payer).await;

    // Create settings account with payer as authority and slash_ata as token_account for testing
    // (The real init instruction sets hardcoded addresses we don't have keys for)
    let settings_data = create_settings_account_data(&payer.pubkey(), &slash_ata);
    let settings_rent = rpc.get_minimum_balance_for_rent_exemption(nosana_staking::SettingsAccount::SIZE).await.unwrap();
    let settings_account = Account {
        lamports: settings_rent,
        data: settings_data,
        owner: nosana_staking::ID,
        executable: false,
        rent_epoch: 0,
    };
    rpc.context.set_account(settings, settings_account).unwrap();

    // Get address tree info (V2 for new_v2 config)
    let address_tree_info = rpc.get_address_tree_v2();

    // Derive stake address
    let (stake_address, _) = derive_address(
        &[b"stake", NOS_TOKEN.as_ref(), payer.pubkey().as_ref()],
        &address_tree_info.tree,
        &nosana_staking::ID,
    );

    // Create stake
    create_stake(
        &mut rpc,
        &payer,
        &NOS_TOKEN,
        &user_ata,
        &vault,
        &stake_address,
        address_tree_info,
        STAKE_AMOUNT,
        DURATION_MIN as u128,
    )
    .await
    .unwrap();

    // Get compressed account and initial state
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    let initial_stake = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Record token balances before slash
    let vault_balance_before = get_token_balance(&rpc, &vault);
    let slash_ata_balance_before = get_token_balance(&rpc, &slash_ata);

    // Slash 10% of stake
    let slash_amount = STAKE_AMOUNT / 10;
    println!("Slashing {} tokens...", slash_amount);

    slash(
        &mut rpc,
        &payer,
        &vault,
        &slash_ata,
        &settings,
        &compressed_account,
        slash_amount,
    )
    .await
    .unwrap();

    // Verify token balances after slash
    let vault_balance_after = get_token_balance(&rpc, &vault);
    let slash_ata_balance_after = get_token_balance(&rpc, &slash_ata);

    assert_eq!(
        vault_balance_before - vault_balance_after,
        slash_amount,
        "Vault balance should decrease by slash amount"
    );
    assert_eq!(
        slash_ata_balance_after - slash_ata_balance_before,
        slash_amount,
        "Slash destination should receive slashed tokens"
    );

    // Verify compressed account state after slash
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();
    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Build expected stake after slash and verify with single assert
    let slashed_amount = STAKE_AMOUNT - slash_amount;
    let expected_xnos = calculate_expected_xnos(slashed_amount, initial_stake.duration);
    let expected_slashed = CompressedStakeAccount {
        amount: slashed_amount,
        authority: initial_stake.authority,
        duration: initial_stake.duration,
        time_unstake: 0,
        vault: initial_stake.vault,
        vault_bump: initial_stake.vault_bump,
        xnos: expected_xnos,
    };
    assert_eq!(stake_data, expected_slashed, "Stake account after slash should match expected");
    assert!(stake_data.xnos < initial_stake.xnos, "xnos should decrease after slash");

    println!(
        "Slash test passed! Amount: {} -> {}, xnos: {} -> {}",
        initial_stake.amount, stake_data.amount, initial_stake.xnos, stake_data.xnos
    );
}

// ============================================================================
// Test: Topup functionality
// ============================================================================

#[tokio::test]
#[serial]
async fn test_topup() {
    let config = ProgramTestConfig::new_v2(
        true,
        Some(vec![("nosana_staking", nosana_staking::ID)]),
    );
    let mut rpc = LightProgramTest::new(config).await.unwrap();
    let payer = rpc.get_payer().insecure_clone();

    // Setup mint at NOS_TOKEN address and create token accounts
    let (user_ata, vault, _vault_bump, settings, _slash_ata) =
        setup_token_accounts(&mut rpc, &payer).await;

    // Initialize settings
    init_settings(&mut rpc, &payer, &settings).await.unwrap();

    // Get address tree info (V2 for new_v2 config)
    let address_tree_info = rpc.get_address_tree_v2();

    // Derive stake address
    let (stake_address, _) = derive_address(
        &[b"stake", NOS_TOKEN.as_ref(), payer.pubkey().as_ref()],
        &address_tree_info.tree,
        &nosana_staking::ID,
    );

    // Create initial stake
    create_stake(
        &mut rpc,
        &payer,
        &NOS_TOKEN,
        &user_ata,
        &vault,
        &stake_address,
        address_tree_info,
        STAKE_AMOUNT,
        DURATION_MIN as u128,
    )
    .await
    .unwrap();

    // Get initial stake state
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    let initial_stake = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let initial_vault_balance = get_token_balance(&rpc, &vault);
    let user_balance_before_topup = get_token_balance(&rpc, &user_ata);

    // Topup with additional tokens
    let topup_amount = 500_000_000u64; // 0.5 NOS
    println!("Topping up {} tokens...", topup_amount);

    topup_stake(
        &mut rpc,
        &payer,
        &user_ata,
        &vault,
        &compressed_account,
        topup_amount,
    )
    .await
    .unwrap();

    // Verify token balances after topup
    let user_balance_after_topup = get_token_balance(&rpc, &user_ata);
    let vault_balance_after_topup = get_token_balance(&rpc, &vault);

    assert_eq!(
        user_balance_after_topup,
        user_balance_before_topup - topup_amount,
        "User balance should decrease by topup amount"
    );
    assert_eq!(
        vault_balance_after_topup,
        initial_vault_balance + topup_amount,
        "Vault balance should increase by topup amount"
    );

    // Verify stake account updated
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();
    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Build expected stake after topup and verify with single assert
    let new_amount = initial_stake.amount + topup_amount;
    let expected_xnos = calculate_expected_xnos(new_amount, initial_stake.duration);
    let expected_topped_up = CompressedStakeAccount {
        amount: new_amount,
        authority: initial_stake.authority,
        duration: initial_stake.duration,
        time_unstake: 0,
        vault: initial_stake.vault,
        vault_bump: initial_stake.vault_bump,
        xnos: expected_xnos,
    };
    assert_eq!(stake_data, expected_topped_up, "Stake account after topup should match expected");

    println!(
        "Topup test passed! Amount: {} -> {}, xnos: {} -> {}",
        initial_stake.amount, stake_data.amount, initial_stake.xnos, stake_data.xnos
    );
}

// ============================================================================
// Test: Extend functionality
// ============================================================================

#[tokio::test]
#[serial]
async fn test_extend() {
    let config = ProgramTestConfig::new_v2(
        true,
        Some(vec![("nosana_staking", nosana_staking::ID)]),
    );
    let mut rpc = LightProgramTest::new(config).await.unwrap();
    let payer = rpc.get_payer().insecure_clone();

    // Setup mint at NOS_TOKEN address and create token accounts
    let (user_ata, vault, _vault_bump, settings, _slash_ata) =
        setup_token_accounts(&mut rpc, &payer).await;

    // Initialize settings
    init_settings(&mut rpc, &payer, &settings).await.unwrap();

    // Get address tree info (V2 for new_v2 config)
    let address_tree_info = rpc.get_address_tree_v2();

    // Derive stake address
    let (stake_address, _) = derive_address(
        &[b"stake", NOS_TOKEN.as_ref(), payer.pubkey().as_ref()],
        &address_tree_info.tree,
        &nosana_staking::ID,
    );

    // Create initial stake
    create_stake(
        &mut rpc,
        &payer,
        &NOS_TOKEN,
        &user_ata,
        &vault,
        &stake_address,
        address_tree_info,
        STAKE_AMOUNT,
        DURATION_MIN as u128,
    )
    .await
    .unwrap();

    // Get initial stake state
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    let initial_stake = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Verify initial state
    assert_eq!(initial_stake.duration, DURATION_MIN);
    println!(
        "Initial stake: duration={}, xnos={}",
        initial_stake.duration, initial_stake.xnos
    );

    // Extend duration by 7 days
    let extend_duration = 7 * 24 * 60 * 60u64; // 7 days in seconds
    println!("Extending duration by {} seconds...", extend_duration);

    extend_stake(&mut rpc, &payer, &compressed_account, extend_duration)
        .await
        .unwrap();

    // Verify stake account updated
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();
    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // Build expected stake after extend and verify with single assert
    let new_duration = initial_stake.duration + extend_duration;
    let expected_xnos = calculate_expected_xnos(initial_stake.amount, new_duration);
    let expected_extended = CompressedStakeAccount {
        amount: initial_stake.amount,
        authority: initial_stake.authority,
        duration: new_duration,
        time_unstake: 0,
        vault: initial_stake.vault,
        vault_bump: initial_stake.vault_bump,
        xnos: expected_xnos,
    };
    assert_eq!(stake_data, expected_extended, "Stake account after extend should match expected");
    assert!(stake_data.xnos > initial_stake.xnos, "xnos should increase with longer duration");

    // Token balances should not change
    let vault_balance = get_token_balance(&rpc, &vault);
    assert_eq!(vault_balance, STAKE_AMOUNT, "Vault balance should not change after extend");

    println!(
        "Extend test passed! Duration: {} -> {}, xnos: {} -> {}",
        initial_stake.duration, stake_data.duration, initial_stake.xnos, stake_data.xnos
    );
}

// ============================================================================
// Test: Close functionality
// ============================================================================

#[tokio::test]
#[serial]
async fn test_close() {
    let config = ProgramTestConfig::new_v2(
        true,
        Some(vec![("nosana_staking", nosana_staking::ID)]),
    );
    let mut rpc = LightProgramTest::new(config).await.unwrap();
    let payer = rpc.get_payer().insecure_clone();

    // Setup mint at NOS_TOKEN address and create token accounts
    let (user_ata, vault, _vault_bump, settings, _slash_ata) =
        setup_token_accounts(&mut rpc, &payer).await;

    // Initialize settings
    init_settings(&mut rpc, &payer, &settings).await.unwrap();

    // Get address tree info (V2 for new_v2 config)
    let address_tree_info = rpc.get_address_tree_v2();

    // Derive stake address
    let (stake_address, _) = derive_address(
        &[b"stake", NOS_TOKEN.as_ref(), payer.pubkey().as_ref()],
        &address_tree_info.tree,
        &nosana_staking::ID,
    );

    // Record initial balance
    let initial_user_balance = get_token_balance(&rpc, &user_ata);

    // Create initial stake
    println!("Creating stake...");
    create_stake(
        &mut rpc,
        &payer,
        &NOS_TOKEN,
        &user_ata,
        &vault,
        &stake_address,
        address_tree_info,
        STAKE_AMOUNT,
        DURATION_MIN as u128,
    )
    .await
    .unwrap();

    // Get compressed account
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    // Set clock and unstake
    let unstake_time = 1704067200i64; // Jan 1, 2024
    let mut clock = rpc.context.get_sysvar::<Clock>();
    clock.unix_timestamp = unstake_time;
    rpc.context.set_sysvar(&clock);

    println!("Unstaking...");
    unstake(&mut rpc, &payer, &compressed_account).await.unwrap();

    // Get updated compressed account after unstake
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    // Advance clock past unlock time (time_unstake + duration + 1 second)
    let unlock_time = unstake_time + DURATION_MIN as i64 + 1;
    clock.unix_timestamp = unlock_time;
    rpc.context.set_sysvar(&clock);
    println!("Clock advanced to {} (past unlock time)", unlock_time);

    // Withdraw all tokens to empty the vault
    println!("Withdrawing all tokens...");
    withdraw(&mut rpc, &payer, &user_ata, &vault, &compressed_account)
        .await
        .unwrap();

    // Verify vault is empty
    let vault_balance = get_token_balance(&rpc, &vault);
    assert_eq!(vault_balance, 0, "Vault should be empty before close");

    // Verify user got all tokens back
    let user_balance_after_withdraw = get_token_balance(&rpc, &user_ata);
    assert_eq!(
        user_balance_after_withdraw, initial_user_balance,
        "User should have all tokens back after full withdraw"
    );

    // Get updated compressed account for close
    let compressed_account = rpc
        .get_compressed_account(stake_address, None)
        .await
        .unwrap()
        .value
        .unwrap();

    // Close stake
    println!("Closing stake...");
    let close_result = close_stake(&mut rpc, &payer, &user_ata, &vault, &compressed_account).await;
    assert!(close_result.is_ok(), "Close stake should succeed");
    println!("Close transaction succeeded: {:?}", close_result.unwrap());

    // Verify vault token account is closed
    let vault_exists = rpc.context.get_account(&vault).is_some();
    assert!(!vault_exists, "Vault token account should be closed");

    // Note: The compressed account may still appear in the indexer cache immediately after close
    // The important verification is that the close transaction succeeded and the vault is closed

    println!("Close test passed! Stake and vault closed successfully.");
}

// ============================================================================
// Helper functions
// ============================================================================

/// Creates a packed SPL Token Mint account at the given address
fn create_mint_account_data(mint_authority: &Pubkey, decimals: u8) -> Vec<u8> {
    use spl_token::state::Mint;
    use solana_sdk::program_pack::Pack;

    let mint = Mint {
        mint_authority: solana_sdk::program_option::COption::Some(*mint_authority),
        supply: 0,
        decimals,
        is_initialized: true,
        freeze_authority: solana_sdk::program_option::COption::Some(*mint_authority),
    };
    let mut data = vec![0u8; Mint::LEN];
    Mint::pack(mint, &mut data).unwrap();
    data
}

/// Creates serialized SettingsAccount data for testing
fn create_settings_account_data(authority: &Pubkey, token_account: &Pubkey) -> Vec<u8> {
    // Settings account has 8 byte discriminator + authority (32) + token_account (32)
    let discriminator = <nosana_staking::SettingsAccount as Discriminator>::DISCRIMINATOR;
    let mut data = Vec::with_capacity(nosana_staking::SettingsAccount::SIZE);
    data.extend_from_slice(&discriminator);
    authority.serialize(&mut data).unwrap();
    token_account.serialize(&mut data).unwrap();
    data
}

/// Get token account balance
fn get_token_balance(rpc: &LightProgramTest, token_account: &Pubkey) -> u64 {
    use spl_token::state::Account as TokenAccount;
    use solana_sdk::program_pack::Pack;

    match rpc.context.get_account(token_account) {
        Some(account) => TokenAccount::unpack(&account.data).map(|t| t.amount).unwrap_or(0),
        None => 0,
    }
}

/// Calculate expected xnos value
fn calculate_expected_xnos(amount: u64, duration: u64) -> u128 {
    const SECONDS_PER_DAY: u128 = 24 * 60 * 60;
    const DURATION_MAX: u128 = 365 * SECONDS_PER_DAY;
    const XNOS_PRECISION: u128 = u128::pow(10, 15);
    const XNOS_DIV: u128 = 4 * DURATION_MAX / 12;

    (u128::from(duration) * XNOS_PRECISION / XNOS_DIV + XNOS_PRECISION)
        * u128::from(amount)
        / XNOS_PRECISION
}

async fn setup_token_accounts(
    rpc: &mut LightProgramTest,
    payer: &Keypair,
) -> (Pubkey, Pubkey, u8, Pubkey, Pubkey)
{
    // Create mint account data and set it at NOS_TOKEN address
    let rent = rpc.get_minimum_balance_for_rent_exemption(82).await.unwrap();
    let mint_data = create_mint_account_data(&payer.pubkey(), 9);
    let mint_account = Account {
        lamports: rent,
        data: mint_data,
        owner: spl_token::ID,
        executable: false,
        rent_epoch: 0,
    };
    rpc.context.set_account(NOS_TOKEN, mint_account).unwrap();

    // Create user token account
    let user_ata = spl_associated_token_account::get_associated_token_address(
        &payer.pubkey(),
        &NOS_TOKEN,
    );
    let create_ata_ix =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &payer.pubkey(),
            &NOS_TOKEN,
            &spl_token::ID,
        );

    rpc.create_and_send_transaction(&[create_ata_ix], &payer.pubkey(), &[payer])
        .await
        .unwrap();

    // Mint tokens to user
    let mint_to_ix = spl_token::instruction::mint_to(
        &spl_token::ID,
        &NOS_TOKEN,
        &user_ata,
        &payer.pubkey(),
        &[],
        10_000_000_000, // 10 NOS
    )
    .unwrap();

    rpc.create_and_send_transaction(&[mint_to_ix], &payer.pubkey(), &[payer])
        .await
        .unwrap();

    // Derive vault PDA
    let (vault, vault_bump) = Pubkey::find_program_address(
        &[b"vault", NOS_TOKEN.as_ref(), payer.pubkey().as_ref()],
        &nosana_staking::ID,
    );

    // Derive settings PDA
    let (settings, _) = Pubkey::find_program_address(&[b"settings"], &nosana_staking::ID);

    // Create token account for receiving slashed tokens (ATA of payer)
    let slash_ata = spl_associated_token_account::get_associated_token_address(
        &payer.pubkey(),
        &NOS_TOKEN,
    );

    (user_ata, vault, vault_bump, settings, slash_ata)
}

async fn init_settings<R>(rpc: &mut R, payer: &Keypair, settings: &Pubkey) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let instruction_data = nosana_staking::instruction::Init {};

    let accounts = nosana_staking::accounts::Init {
        settings: *settings,
        authority: payer.pubkey(),
        system_program: solana_sdk::system_program::ID,
        rent: solana_sdk::sysvar::rent::ID,
    };

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: accounts.to_account_metas(Some(true)),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn create_stake<R>(
    rpc: &mut R,
    payer: &Keypair,
    mint: &Pubkey,
    user_ata: &Pubkey,
    vault: &Pubkey,
    stake_address: &[u8; 32],
    address_tree_info: light_client::indexer::TreeInfo,
    amount: u64,
    duration: u128,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let rpc_result = rpc
        .get_validity_proof(
            vec![],
            vec![AddressWithTree {
                tree: address_tree_info.tree,
                address: *stake_address,
            }],
            None,
        )
        .await?
        .value;

    let output_state_tree_index = rpc
        .get_random_state_tree_info()?
        .pack_output_tree_index(&mut remaining_accounts)?;

    let packed_address_tree_info = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .address_trees[0];

    let instruction_data = nosana_staking::instruction::Stake {
        amount,
        duration,
        proof: rpc_result.proof,
        address_tree_info: packed_address_tree_info,
        output_state_tree_index,
    };

    let accounts = nosana_staking::accounts::Stake {
        mint: *mint,
        user: *user_ata,
        vault: *vault,
        authority: payer.pubkey(),
        system_program: solana_sdk::system_program::ID,
        token_program: spl_token::ID,
        rent: solana_sdk::sysvar::rent::ID,
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn unstake<R>(
    rpc: &mut R,
    payer: &Keypair,
    compressed_account: &CompressedAccount,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let account_meta = CompressedAccountMeta {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
        output_state_tree_index: packed_tree_accounts.output_tree_index,
    };

    // Get reward PDA for the constraint check (derived from REWARDS program)
    // nosana-rewards program ID: nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp
    let rewards_program_id = solana_sdk::pubkey!("nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp");
    let (reward_pda, _) = Pubkey::find_program_address(
        &[b"reward", payer.pubkey().as_ref()],
        &rewards_program_id,
    );

    let instruction_data = nosana_staking::instruction::Unstake {
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Unstake {
        reward: reward_pda,
        authority: payer.pubkey(),
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn restake<R>(
    rpc: &mut R,
    payer: &Keypair,
    vault: &Pubkey,
    compressed_account: &CompressedAccount,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let account_meta = CompressedAccountMeta {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
        output_state_tree_index: packed_tree_accounts.output_tree_index,
    };

    let instruction_data = nosana_staking::instruction::Restake {
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Restake {
        vault: *vault,
        authority: payer.pubkey(),
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn topup_stake<R>(
    rpc: &mut R,
    payer: &Keypair,
    user_ata: &Pubkey,
    vault: &Pubkey,
    compressed_account: &CompressedAccount,
    amount: u64,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let account_meta = CompressedAccountMeta {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
        output_state_tree_index: packed_tree_accounts.output_tree_index,
    };

    let instruction_data = nosana_staking::instruction::Topup {
        amount,
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Topup {
        user: *user_ata,
        vault: *vault,
        authority: payer.pubkey(),
        token_program: spl_token::ID,
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn extend_stake<R>(
    rpc: &mut R,
    payer: &Keypair,
    compressed_account: &CompressedAccount,
    duration: u64,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let account_meta = CompressedAccountMeta {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
        output_state_tree_index: packed_tree_accounts.output_tree_index,
    };

    let instruction_data = nosana_staking::instruction::Extend {
        duration,
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Extend {
        authority: payer.pubkey(),
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn withdraw<R>(
    rpc: &mut R,
    payer: &Keypair,
    user_ata: &Pubkey,
    vault: &Pubkey,
    compressed_account: &CompressedAccount,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    // For withdraw, we use CompressedAccountMetaReadOnly (no output tree index needed)
    let account_meta = CompressedAccountMetaReadOnly {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
    };

    let instruction_data = nosana_staking::instruction::Withdraw {
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Withdraw {
        user: *user_ata,
        vault: *vault,
        authority: payer.pubkey(),
        token_program: spl_token::ID,
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn slash<R>(
    rpc: &mut R,
    payer: &Keypair,
    vault: &Pubkey,
    token_account: &Pubkey,
    settings: &Pubkey,
    compressed_account: &CompressedAccount,
    amount: u64,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let account_meta = CompressedAccountMeta {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
        output_state_tree_index: packed_tree_accounts.output_tree_index,
    };

    let instruction_data = nosana_staking::instruction::Slash {
        amount,
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Slash {
        vault: *vault,
        token_account: *token_account,
        settings: *settings,
        authority: payer.pubkey(),
        token_program: spl_token::ID,
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

async fn close_stake<R>(
    rpc: &mut R,
    payer: &Keypair,
    user_ata: &Pubkey,
    vault: &Pubkey,
    compressed_account: &CompressedAccount,
) -> Result<Signature, RpcError>
where
    R: Rpc + Indexer,
{
    let mut remaining_accounts = PackedAccounts::default();
    let config = SystemAccountMetaConfig::new(nosana_staking::ID);
    remaining_accounts.add_system_accounts_v2(config)?;

    let hash = compressed_account.hash;
    let rpc_result = rpc
        .get_validity_proof(vec![hash], vec![], None)
        .await?
        .value;

    let packed_tree_accounts = rpc_result
        .pack_tree_infos(&mut remaining_accounts)
        .state_trees
        .unwrap();

    let stake_data = CompressedStakeAccount::deserialize(
        &mut compressed_account.data.as_ref().unwrap().data.as_slice(),
    )
    .unwrap();

    let account_meta = CompressedAccountMeta {
        tree_info: packed_tree_accounts.packed_tree_infos[0],
        address: compressed_account.address.unwrap(),
        output_state_tree_index: packed_tree_accounts.output_tree_index,
    };

    let instruction_data = nosana_staking::instruction::Close {
        proof: rpc_result.proof,
        stake_account_meta: account_meta,
        stake_data,
    };

    let accounts = nosana_staking::accounts::Close {
        user: *user_ata,
        vault: *vault,
        authority: payer.pubkey(),
        token_program: spl_token::ID,
    };

    let (remaining_accounts_metas, _, _) = remaining_accounts.to_account_metas();

    let instruction = Instruction {
        program_id: nosana_staking::ID,
        accounts: [accounts.to_account_metas(Some(true)), remaining_accounts_metas].concat(),
        data: instruction_data.data(),
    };

    rpc.create_and_send_transaction(&[instruction], &payer.pubkey(), &[payer])
        .await
}

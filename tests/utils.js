const anchor = require("@project-serum/anchor");
const serumCmn = require("@project-serum/common");
const {TOKEN_PROGRAM_ID, createMint, createMintToInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction} = require("@solana/spl-token");
const assert = require("assert");

async function getTokenBalance(provider, wallet) {
  return parseInt((await provider.connection.getTokenAccountBalance(wallet)).value.amount);
}

async function assertBalancesJobs(provider, wallets, balances) {
  for (const pool of ['user', 'vaultJob']) {
    console.log(`       ==> Balance pool: ${pool}, ${balances[pool]} tokens`);
  }
  assert.strictEqual(await getTokenBalance(provider, wallets.user), balances.user);
  assert.strictEqual(await getTokenBalance(provider, wallets.vaultJob), balances.vaultJob);
}

async function assertBalancesStaking(provider, wallets, balances) {
  for (const pool of ['user', 'vaultStaking']) {
    console.log(`       ==> Balance pool: ${pool}, ${balances[pool]} tokens`);
  }
  assert.strictEqual(await getTokenBalance(provider, wallets.user), balances.user);
  assert.strictEqual(await getTokenBalance(provider, wallets.vaultStaking), balances.vaultStaking);
}

async function mintFromFile(key, provider, authority) {
  const keyData = require(`./keys/${key}.json`);
  const keyPair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));
  return await createMint(
    provider.connection,
    provider.wallet.payer,
    authority,
    null,
    6,
    keyPair
  );
}

async function mintToAccount(
  provider,
  mint,
  destination,
  amount
) {
  const tx = new anchor.web3.Transaction();
  tx.add(
    createMintToInstruction(
      mint,
      destination,
      provider.wallet.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID,
    )
  );
  await provider.sendAndConfirm(tx);
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function timeDelta(t1, t2) {
  return t1.toNumber() * 1e3 - t2
}

async function getOrCreateAssociatedSPL(provider, owner, mint) {
  const ata = await getAssociatedTokenAddress(mint, owner)
  try {
    await serumCmn.getTokenAccount(provider, ata)
  } catch (error) {
    const tx = new anchor.web3.Transaction()
    tx.add(createAssociatedTokenAccountInstruction(owner, ata, owner, mint))
    await provider.sendAndConfirm(tx, [], {})
  }
  return ata
}

function setupSolanaUser(connection) {
  const user = anchor.web3.Keypair.generate();
  const publicKey = user.publicKey
  const wallet = new anchor.Wallet(user)
  const provider = new anchor.AnchorProvider(connection, wallet)

  const signers = {
    jobs: anchor.web3.Keypair.generate(),
    job: anchor.web3.Keypair.generate(),
    stake: anchor.web3.Keypair.generate(),
  }
  return {user, publicKey, wallet, provider, signers}
}

module.exports = {
  mintFromFile,
  mintToAccount,
  assertBalancesJobs,
  assertBalancesStaking,
  buf2hex,
  timeDelta,
  getOrCreateAssociatedSPL,
  getTokenBalance,
  setupSolanaUser,
};

const anchor = require("@project-serum/anchor");
const serumCmn = require("@project-serum/common");
const {TOKEN_PROGRAM_ID, Token, MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID} = require("@solana/spl-token");
const assert = require("assert");

async function getTokenBalance(provider, wallet) {
  return parseInt((await provider.connection.getTokenAccountBalance(wallet)).value.amount);
}

async function assertBalances(provider, wallets, balances) {
  for (const pool of ["user", "vault"]) {
    console.log(`       ==> Balance pool: ${pool}, ${balances[pool]} tokens`);
  }
  assert.strictEqual(await getTokenBalance(provider, wallets.user), balances.user);
  assert.strictEqual(await getTokenBalance(provider, wallets.vault), balances.vault);
}

async function createMint(
  mintAccount,
  provider,
  mintAuthority,
  freezeAuthority,
  decimals,
  programId,
) {
  const token = new Token(
    provider.connection,
    mintAccount.publicKey,
    programId,
    provider.wallet.payer,
  );

  // Allocate memory for the account
  const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
    provider.connection,
  );

  const transaction = new anchor.web3.Transaction();
  transaction.add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.payer.publicKey,
      newAccountPubkey: mintAccount.publicKey,
      lamports: balanceNeeded,
      space: MintLayout.span,
      programId,
    }),
  );

  transaction.add(
    Token.createInitMintInstruction(
      programId,
      mintAccount.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority,
    ),
  );

  await provider.send(transaction, [mintAccount]);
  return token;
}

async function mintFromFile(key, provider, authority) {
  const keyData = require(`./keys/${key}.json`);
  const keyPair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));
  return await createMint(keyPair, provider, authority, null, 6, TOKEN_PROGRAM_ID);
}

async function mintToAccount(
  provider,
  mint,
  destination,
  amount
) {
  const tx = new anchor.web3.Transaction();
  tx.add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      destination,
      provider.wallet.publicKey,
      [],
      amount
    )
  );
  await provider.send(tx);
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
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint.publicKey, owner, true)
  try {
    await serumCmn.getTokenAccount(provider, ata)
  } catch (error) {
    const tx = new anchor.web3.Transaction()
    tx.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint.publicKey, ata, owner, owner))
    await provider.send(tx, [], {})
  }
  return ata
}

function setupSolanaUser(connection) {
  const user = anchor.web3.Keypair.generate();
  const publicKey = user.publicKey
  const wallet = new anchor.Wallet(user)
  const provider = new anchor.Provider(connection, wallet)

  const signers = {
    jobs: anchor.web3.Keypair.generate(),
    job: anchor.web3.Keypair.generate(),
  }
  return {user, publicKey, wallet, provider, signers}
}

module.exports = {
  mintFromFile,
  mintToAccount,
  assertBalances,
  buf2hex,
  timeDelta,
  getOrCreateAssociatedSPL,
  getTokenBalance,
  setupSolanaUser,
};

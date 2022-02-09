const anchor = require("@project-serum/anchor");
const fs = require('fs');
const {TOKEN_PROGRAM_ID, Token, MintLayout} = require("@solana/spl-token");
const assert = require("assert");

async function getTokenBalance(provider, wallet) {
  return parseInt((await provider.connection.getTokenAccountBalance(wallet)).value.amount);
}

async function assertBalances(provider, wallets, balances) {
  for (const pool of ["tokens", "reward", "vault"]) {
    console.log(`       ==> Balance pool: ${pool}, ${balances[pool]} tokens`);
  }
  assert.strictEqual(await getTokenBalance(provider, wallets.tokens), balances.tokens);
  assert.strictEqual(await getTokenBalance(provider, wallets.reward), balances.reward);
  assert.strictEqual(await getTokenBalance(provider, wallets.vault), balances.vault);
}

async function assertPrice(program, spl, balances) {

  // rpc
  const res = await program.simulate.emitPrice(
    {
      accounts: {
        tokens: spl.tokens,
        reward: spl.reward,
        vault: spl.vault,
      }
    }
  );

  let price = res.events[0].data;

  // inform user
  console.log('        $ price NOS/xNOS: ', price.nosPerXnos);

  // tests
  assert.strictEqual((price.nosPerXnosE6 / 1e6).toString(), price.nosPerXnos)
  assert.strictEqual(price.nosPerXnos.toString(), balances.reward === 0 ? '0' : (balances.vault / balances.reward).toString());
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
  let text = fs.readFileSync(`tests/keys/${key}.json`);
  const keyData = JSON.parse(text.toString());
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


module.exports = {
  mintFromFile,
  mintToAccount,
  assertPrice,
  assertBalances,
};

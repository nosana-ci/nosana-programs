# Introduction to working in the Nosana Programs repository 🎊

The Nosana Programs repository uses different tools to compile, test and deploy the Nosana Programs
to Solana.

This doc should set you up with a local development environment.

## Anchor

The [Anchor](https://github.com/project-serum/anchor) framework is used to develop and build the Solana programs.
To get started, see the [guide](https://book.anchor-lang.com/getting_started/getting_started.html).

### Wallet

The default wallet location is set be located in `~/.config/solana/id.json`.
When you like to use a different location use the flag `--provider.wallet`, and do not change the `Anchor.toml`.

### Build

```
anchor build
```

The `--verifiable` flag could be used before deploying so that your build artifacts can be deterministically generated
with docker.

### Test

When testing locally, be sure to build with disabled feature "mainnet" to enable the testing IDs. You can do this by
editing `programs/nosana_commmons/Cargo.toml` and commenting the default feature set line.

```
anchor test
```

### Verify

To verify the program deployed on Solana matches your local source code, change directory into the program you want to
verify, e.g., `cd program`, and run

```bash
anchor verify -d projectserum/build:v0.22.1 --provider.cluster $CLUSTER nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM
```

A list of build artifacts can be found in gitlab cicd.

### Upgrade

To upgrade a deployed program, configure your CLI to the desired network/wallet and run.

```bash
anchor upgrade --program-id $PROGRAM_ID --provider.cluster $CLUSTER target/deploy/$PROGRAM_NAME.so
```

To upgrade an IDL

```bash
anchor idl upgrade -f target/idl/$PROGRAM_NAME.json --provider.cluster $CLUSTER $PROGRAM_ID
```

### Publish

To publish the

### Initial Migration

After deployment for the first time, you must point your `anchor.toml` file to the network you've deployed to and run

```bash
anchor migrate
```

This will call the `initialize` method to create the token vaults. No specific calling key is needed - it can be called
by anyone, and is a once only operation for PDA vault creation. Subsequent runs will fail.

Any problems in this process can be triaged in the `migrations/deploy.js` file, which is what `anchor migrate` executes.

<h1 align="center">
  <br>
   <img width="400" src="https://nosana.io/img/Nosana_Logo_vertical_color_black.svg" alt="step logo"/>
  <br>
</h1>

# Nosana Jobs

Solana Program for creating Nosana jobs.

## Note

- **This code is unaudited. Use at your own risk.**

## Developing

[Anchor](https://github.com/project-serum/anchor) is used for developoment, and it's recommended workflow is used here.
To get started, see the [guide](https://project-serum.github.io/anchor/getting-started/introduction.html).

### Wallet

The default wallet location is set be located in `~/.config/solana/id.json`.
When you like to use a different location use the flag `--provider.wallet`, and deo not change the `Anchor.toml`.

### Build

```
anchor build --verifiable
```

The `--verifiable` flag should be used before deploying so that your build artifacts can be deterministically generated
with docker.

### Test

When testing locally, be sure to build with disabled feature "mainnet" to enable the testing IDs. You can do this by
editing `programs/nosana_jobs/Cargo.toml` and commenting the default feature set line.

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

To deploy the program, configure your CLI to the desired network/wallet and run

```bash
anchor upgrade --program-id nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM --provider.cluster $CLUSTER target/deploy/nosana_jobs.so
```

### Initial Migration

After deployment for the first time, you must point your `anchor.toml` file to the network you've deployed to and run

```bash
anchor migrate
```

This will call the `initialize` method to create the token vault. No specific calling key is needed - it can be called
by anyone, and is a once only operation for PDA vault creation. Subsequent runs will fail.

Any problems in this process can be triaged in the `migrations/deploy.js` file, which is what `anchor migrate` executes.

## License

This Nosana program are licensed under the MIT license.

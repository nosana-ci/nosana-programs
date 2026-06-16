# Development Setup

This guide covers setting up a local development toolchain for the Nosana SPL programs using Anchor and avm (Anchor Version Manager).

## Prerequisites

- **Rust v1.89.0**
- **Solana CLI v3.1.10**
- **Anchor v1.0.2**

We recommend using [avm](https://www.anchor-lang.com/docs/references/avm) to manage Anchor versions.

### Install the required Anchor version

```bash
avm install 1.0.2
avm use 1.0.2
```

## Verifying Installation

```bash
# Check avm is installed
avm --version

# Check Anchor is installed
anchor --version

# Check Solana CLI
solana --version

# Check Rust
cargo --version
```

## Building the Project

Use Anchor to build the program:

```bash
anchor build
```

### Mainnet Build

For mainnet deployments, use the `mainnet` feature flag:

```bash
anchor build -- --features "mainnet"
```

### Verifiable Build

To create a verifiable build (deterministic compilation for on-chain verification):

```bash
anchor build --verifiable

# for mainnet
anchor build --verifiable -- --features "mainnet" 
```

This will:
- Compile the Rust program to BPF bytecode
- Generate TypeScript types in `target/types/`
- Create the program IDL in `target/idl/`

## Running Tests

Anchor provides a test environment:

```bash
# Run all tests
anchor test --validator legacy --skip-build

# Run specific test 
TEST_SCENARIO=jobs anchor test --validator legacy --skip-build
```

## Common Tasks

### Cleaning build artifacts

```bash
anchor clean
# or
rm -rf ./target
```


![logo](https://github.com/nosana-ci/.github/raw/refs/heads/main/profile/img/Nosana_Logo_horizontal_color_white.svg#gh-dark-mode-only)

# Nosana Program Library

Library of Solana programs used in the [Nosana Network](https://app.nosana.io).

## ⚠ Warning

**Most code is unaudited. Use at your own risk.**

## Nosana Programs

Four Nosana programs can be found in this repository, together with the [Nosana Common](https://github.com/nosana-ci/nosana-programs/blob/main/docs/common.md) crate.


| program                                                   | program address                               | devnet                                                                                              | mainnet                                                                              |
|-----------------------------------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| [Nosana Staking](https://docs.nosana.io/programs/staking) | `nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE` | [✅](https://explorer.solana.com/address/nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE?cluster=devnet) | [✅](https://explorer.solana.com/address/nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE) |
| [Nosana Rewards](https://docs.nosana.io/programs/rewards) | `nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp` | [✅](https://explorer.solana.com/address/nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp?cluster=devnet) | [✅](https://explorer.solana.com/address/nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp) |
| [Nosana Pools](https://docs.nosana.io/programs/pools)     | `nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD` | [✅](https://explorer.solana.com/address/nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD?cluster=devnet) | [✅](https://explorer.solana.com/address/nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD) |
| [Nosana Jobs](https://docs.nosana.io/programs/jobs)       | `nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM` | [✅](https://explorer.solana.com/address/nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM?cluster=devnet) | [✅](https://explorer.solana.com/address/nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM) |

## Audits

The external audits of the following Nosana programs are published in this repository:

| program        | report                                                                                                                   | auditor                        | date       | status |
|----------------|--------------------------------------------------------------------------------------------------------------------------|--------------------------------|------------|--------|
| Nosana Staking | [NOSANA_STAKING_REPORT_1.pdf](https://github.com/nosana-ci/nosana-programs/blob/main/audits/NOSANA_STAKING_REPORT_1.pdf) | [Op Codes](https://opcodes.fr) | 10-08-2022 | ✅      |
| Nosana Staking | [NOSANA_STAKING_REPORT_2.pdf](https://github.com/nosana-ci/nosana-programs/blob/main/audits/NOSANA_STAKING_REPORT_2.pdf) | [Op Codes](https://opcodes.fr) | 23-08-2022 | ✅      |

## Contribution

See [CONTRIBUTING](https://github.com/nosana-ci/nosana-programs/blob/main/CONTRIBUTING.md) guidelines.

Significant contributions to the source code may be compensated with a grant from the [Nosana Foundation](https://nosana.foundation/).

## Development

See [docs/development.md](./docs/development.md) for a complete guide to setting up your development environment and working with this codebase.

## Deployment

See [docs/deployment.md](./docs/deployment.md) for how the programs are deployed and upgraded: what each CI job does, and how mainnet upgrades are prepared by CI and executed through the Squads multisig.


## License

This Nosana Programs are licensed under the [MIT license](https://github.com/nosana-ci/nosana-programs/blob/main/LICENSE).

#!/usr/bin/env bash

# exit upon failure
set -e

# setup
[[ -n "${DEBUG_SCRIPT}" ]] && set -xv

# prepare cargo for mainnet
sed -i 's/#default/default/' programs/nosana_jobs/Cargo.toml

# regular build
anchor build

#!/usr/bin/env bash

# exit upon failure
set -e

# setup
[[ -n "${DEBUG_SCRIPT}" ]] && set -xv

# colors
RED="\033[1;91m"
CYAN="\033[1;36m"
GREEN="\033[1;32m"
WHITE="\033[1;38;5;231m"
RESET="\n\033[0m"

# functions
log_std() { echo -e "${CYAN}==> ${WHITE}${1}${RESET}"; }
log_err() { echo -e "${RED}==> ${WHITE}${1}${RESET}"; }

# variables
tag=$(git tag  | grep -E '^v[0-9]' | sort -V | tail -1)
toml=programs/nosana-jobs/Cargo.toml

# prepare cargo for mainnet
log_std "Setup for mainnet"
sed -i "s/#default/default/" "${toml}"

log_std "Set version to ${GREEN}${tag}"
sed -i "s/0.1.0/${tag:1}/" "${toml}"

# regular build
anchor build

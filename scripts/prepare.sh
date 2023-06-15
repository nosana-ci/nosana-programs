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
git fetch --tags -q
commit=$(git log -1 --format="%H")
tag=$(git tag --contains "$commit" --list "*v*" --sort=v:refname)
if [[ -z "${tag}" ]]; then
  log_err "No ${GREEN}tag${WHITE} found.."
  exit 1
fi

# prepare cargo for mainnet
log_std "Setup commit ${GREEN}${commit}${WHITE} for mainnet"
sed -i "s/#default/default/" common/Cargo.toml

log_std "Set version to ${GREEN}${tag}"
sed -i "s/0.1.0/${tag:1}/" common/Cargo.toml programs/nosana-*/Cargo.toml

log_std "Include 'common' for anchor publish"
sed -i "s/#//" Anchor.toml

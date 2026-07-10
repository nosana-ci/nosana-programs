#!/usr/bin/env bash

# exit upon failure
set -euo pipefail

# setup
[[ -n "${DEBUG_SCRIPT:-}" ]] && set -xv

# colors
RED="\033[1;91m"
CYAN="\033[1;36m"
GREEN="\033[1;32m"
WHITE="\033[1;38;5;231m"
RESET="\n\033[0m"

# logging
log_std() { echo -e "${CYAN}==> ${WHITE}${1}${RESET}"; }
log_err() { echo -e "${RED}==> ${WHITE}${1}${RESET}"; }

# early check out
REQUIRED_VARS=(CLUSTER RPC_BASE IRONFORGE_API_KEY PROGRAM_NAME PROGRAM_ID)
if [[ "${CLUSTER:-}" == mainnet ]]; then
  REQUIRED_VARS+=(SQUADS_PUBKEY MSIG_ACCOUNT BASE_IMAGE CI_COMMIT_TAG PROGRAM_METADATA_VERSION)
fi

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    log_err "Required variable ${GREEN}${var}${WHITE} is not set."
    MISSING=1
  fi
done
[[ "${MISSING}" -eq 0 ]] || exit 1

# tools
program_metadata() { npx "@solana-program/program-metadata@${PROGRAM_METADATA_VERSION}" "$@"; }

if [[ "${CLUSTER}" != devnet && "${CLUSTER}" != mainnet ]]; then
  log_err "Variable ${GREEN}CLUSTER${WHITE} must be 'devnet' or 'mainnet', got '${CLUSTER}'."
  exit 1
fi

for file in "target/deploy/${PROGRAM_NAME}.so" "target/idl/${PROGRAM_NAME}.json"; do
  if [[ ! -f "${file}" ]]; then
    log_err "File ${GREEN}${file}${WHITE} not found, run the build first."
    exit 1
  fi
done

export RPC_URL="${RPC_BASE}/${CLUSTER}?apiKey=${IRONFORGE_API_KEY}"

log_std "Patching IDL address to ${GREEN}${PROGRAM_ID}${WHITE}."
jq --arg address "${PROGRAM_ID}" '.address |= $address' "target/idl/${PROGRAM_NAME}.json" | tee idl.json

if [[ "${CLUSTER}" == mainnet ]]; then
  if [[ -n "${SKIP_MAIN:-}" ]]; then
    log_std "Skipping mainnet upgrade because ${GREEN}SKIP_MAIN${WHITE} is set."
    exit 0
  fi

  SPILL_ADDRESS=$(solana address)

  log_std "Writing buffer in ${GREEN}${CLUSTER}${WHITE} with target/deploy/${PROGRAM_NAME}.so."
  solana program write-buffer -u "${RPC_URL}" --output json "target/deploy/${PROGRAM_NAME}.so" | tee buffer.json
  BUFFER_PROGRAM=$(jq -r .buffer buffer.json)
  solana program set-buffer-authority -u "${RPC_URL}" "${BUFFER_PROGRAM}" --new-buffer-authority "${SQUADS_PUBKEY}"

  log_std "Exporting verifiable build transaction for ${GREEN}${PROGRAM_ID}${WHITE}."
  solana-verify export-pda-tx https://github.com/nosana-ci/nosana-programs.git \
    --url "${RPC_URL}" \
    --base-image "${BASE_IMAGE}" \
    --program-id "${PROGRAM_ID}" \
    --commit-hash "${CI_COMMIT_TAG}" \
    --library-name "${PROGRAM_NAME}" \
    --uploader "${SQUADS_PUBKEY}" \
    --encoding base58 \
    --compute-unit-price 0 \
    --cargo-build-sbf-args='--features mainnet' | tee verify.tx

  log_std "Equivalent Squads CLI invocation, for reference:"
  echo squads-multisig-cli initiate-program-upgrade \
    --rpc-url "${RPC_URL}" \
    --keypair usb://ledger \
    --buffer-address "${BUFFER_PROGRAM}" \
    --multisig-pubkey "${MSIG_ACCOUNT}" \
    --spill-address "${SPILL_ADDRESS}" \
    --program-to-upgrade-id "${PROGRAM_ID}" \
    --squads-program-id SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf \
    --vault-index 0 \
    --memo "${CI_COMMIT_TAG}"

  log_std "Writing IDL buffer for ${GREEN}${PROGRAM_ID}${WHITE} in ${CLUSTER} with target/idl/${PROGRAM_NAME}.json."
  program_metadata create-buffer --rpc https://api.mainnet-beta.solana.com "target/idl/${PROGRAM_NAME}.json" | tee idl.output
  BUFFER_IDL=$(grep -oP 'buffer:\s+\K\w+' idl.output)
  log_std "IDL buffer: ${GREEN}${BUFFER_IDL}${WHITE}."
  program_metadata set-buffer-authority "${BUFFER_IDL}" --new-authority "${SQUADS_PUBKEY}" --rpc https://api.mainnet-beta.solana.com
  program_metadata write idl "${PROGRAM_ID}" \
    --buffer "${BUFFER_IDL}" \
    --export "${SQUADS_PUBKEY}" \
    --export-encoding base58 \
    --close-buffer "${SPILL_ADDRESS}" | tee idl.tx

  log_std "Combining transactions into all.tx."
  npm run script:combine-txs -- idl.tx verify.tx --upgrade "${PROGRAM_ID}" "${BUFFER_PROGRAM}" --spill-account "${SPILL_ADDRESS}" -o all.tx

  log_std "Import below transactions in Squads under developers/txBuilder/ImportAsBase58"
  echo -e "\t Upgrade IDL:\n$(tail -n 2 idl.tx)\n"
  echo -e "\t Verifiable build:\n$(tail -n 1 verify.tx)\n"
  echo -e "\t ALL COMBINED:\n$(cat all.tx)\n\n"
  echo -e "To trigger the remote build for verification, invoke this locally:"
  echo -e "\$ solana-verify remote submit-job --program-id ${PROGRAM_ID} --uploader ${SQUADS_PUBKEY} -u ${CLUSTER}"
else
  if [[ -n "${SKIP_DEV:-}" ]]; then
    log_std "Skipping devnet upgrade because ${GREEN}SKIP_DEV${WHITE} is set."
    exit 0
  fi

  log_std "Upgrading ${GREEN}${PROGRAM_ID}${WHITE} in ${CLUSTER} with target/deploy/${PROGRAM_NAME}.so."
  anchor program upgrade --provider.cluster "${RPC_URL}" -p "${PROGRAM_NAME}" "${PROGRAM_ID}"
  log_std "Upgrading IDL for ${GREEN}${PROGRAM_ID}${WHITE} in ${CLUSTER} with idl.json."
  anchor idl upgrade -f idl.json --provider.cluster "${RPC_URL}" "${PROGRAM_ID}"
fi

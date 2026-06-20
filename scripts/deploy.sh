#!/usr/bin/env bash
# Deploy MonsoonMandiEscrow to Monad testnet, then print the .env snippet to copy
# into web/.env.local. Run from repo root: bash scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f web/.env.local ]]; then
    echo "Missing web/.env.local — copy from web/.env.example and fill keys first."
    exit 1
fi

# Export every non-comment line from .env.local into the current shell.
set -a
# shellcheck disable=SC1091
source web/.env.local
set +a

: "${DEPLOYER_PK:?DEPLOYER_PK must be set in web/.env.local}"
: "${VERIFIER_ADDRESS:?VERIFIER_ADDRESS must be set in web/.env.local}"
: "${SLASH_RECIPIENT:?SLASH_RECIPIENT must be set in web/.env.local}"

echo "Deploying MonsoonMandiEscrow to Monad testnet…"
cd contracts
forge build
forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --broadcast --legacy

echo
echo "Once deployed, copy the printed contract address into web/.env.local:"
echo "  ESCROW_ADDRESS=0x..."

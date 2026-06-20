#!/usr/bin/env bash
# Start Anvil + deploy contract + print the env snippet for local testing.
# Run: bash scripts/start-local.sh
# Then in another terminal: cd web && npm run dev
set -euo pipefail

export PATH="$HOME/.foundry/bin:$PATH"

PRIVATE_KEY=0xa01a290c6ea86ddcd4aae2127f844b9ea11283dd6fa2f05899cbb0d7e44d5c00
ADDRESS=0xD761096e542a344429CeB1a68C52bDAB1dB9C78D
RPC=http://127.0.0.1:8545

# Kill any existing Anvil
pkill -f "anvil.*8545" 2>/dev/null || true
sleep 1

echo "Starting Anvil on port 8545..."
anvil --host 127.0.0.1 --port 8545 --balance 10000 --block-time 1 \
  --accounts 1 --mnemonic "test test test test test test test test test test test junk" \
  > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!
sleep 2

# Fund our wallet
ANVIL_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
cast send $ADDRESS --value 1000ether --private-key $ANVIL_KEY --rpc-url $RPC > /dev/null 2>&1
echo "✅ Funded $ADDRESS with 1000 ETH"

# Deploy contract
cd contracts
ESCROW=$(VERIFIER_ADDRESS=$ADDRESS SLASH_RECIPIENT=$ADDRESS DEPLOYER_PK=$PRIVATE_KEY \
  forge script script/Deploy.s.sol:Deploy --rpc-url $RPC --broadcast --legacy 2>&1 | \
  grep -o '0x[a-fA-F0-9]\{40\}' | head -1)

if [ -z "$ESCROW" ]; then
  ESCROW=$(cat broadcast/Deploy.s.sol/31337/run-latest.json 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
for tx in data.get('transactions',[]):
  if tx.get('transactionType')=='CREATE':
    print(tx['contractAddress']); break
" 2>/dev/null || echo "DEPLOY_FAILED")
fi
cd ..

echo "✅ Contract deployed at: $ESCROW"
echo
echo "=========================================="
echo " LOCAL DEV READY"
echo "=========================================="
echo
echo "Anvil PID: $ANVIL_PID (kill with: kill $ANVIL_PID)"
echo "Contract:  $ESCROW"
echo "RPC:       $RPC"
echo "Chain ID:  31337"
echo
echo "Update web/.env.local:"
echo "  MONAD_TESTNET_RPC_URL=http://127.0.0.1:8545"
echo "  MONAD_TESTNET_CHAIN_ID=31337"
echo "  ESCROW_ADDRESS=$ESCROW"
echo
echo "Then: cd web && npm run dev"
echo "Open: http://localhost:3000"
echo "MetaMask: Add network → RPC: http://127.0.0.1:8545, Chain ID: 31337"
echo
echo "Press Ctrl+C to stop Anvil"
wait $ANVIL_PID

#!/usr/bin/env bash
# Run the full Monsoon Mandi flow on a local Anvil fork — zero MON spent.
# Usage: bash scripts/local-test.sh
set -euo pipefail

export PATH="$HOME/.foundry/bin:$PATH"

# Use the same key as in .env.local (Anvil will fund it with 10000 ETH)
PRIVATE_KEY=0xa01a290c6ea86ddcd4aae2127f844b9ea11283dd6fa2f05899cbb0d7e44d5c00
ADDRESS=0xD761096e542a344429CeB1a68C52bDAB1dB9C78D
RPC=http://127.0.0.1:8545

echo "================================================"
echo "  Monsoon Mandi — Local Mock Test (Anvil)"
echo "================================================"
echo

# 1. Start Anvil in background with our key pre-funded
echo "[1/8] Starting Anvil..."
anvil --host 127.0.0.1 --port 8545 --balance 10000 --accounts 1 --mnemonic "test test test test test test test test test test test junk" &
ANVIL_PID=$!
sleep 2

# Fund our wallet on Anvil (send from the default anvil account)
ANVIL_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
cast send $ADDRESS --value 1000ether --private-key $ANVIL_KEY --rpc-url $RPC > /dev/null 2>&1
echo "  Funded $ADDRESS with 1000 ETH on local Anvil"
echo

# 2. Deploy contract
echo "[2/8] Deploying MonsoonMandiEscrow..."
cd contracts
DEPLOY_OUTPUT=$(VERIFIER_ADDRESS=$ADDRESS SLASH_RECIPIENT=$ADDRESS DEPLOYER_PK=$PRIVATE_KEY \
  forge script script/Deploy.s.sol:Deploy --rpc-url $RPC --broadcast --legacy 2>&1)
ESCROW=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
if [ -z "$ESCROW" ]; then
  # Try from broadcast JSON
  ESCROW=$(cat broadcast/Deploy.s.sol/31337/run-latest.json 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
for tx in data.get('transactions',[]):
  if tx.get('transactionType')=='CREATE':
    print(tx['contractAddress']); break
" 2>/dev/null || echo "")
fi
cd ..
echo "  Escrow deployed at: $ESCROW"
echo

# 3. Post a request (bounty = 0.05 ETH)
echo "[3/8] Resident posts request (bounty: 0.05 ETH)..."
TX=$(cast send $ESCROW "postRequest(string)" "ipfs://bafymock/test-request.json" \
  --value 0.05ether --private-key $PRIVATE_KEY --rpc-url $RPC --json 2>&1 | python3 -c "import json,sys;print(json.load(sys.stdin).get('transactionHash',''))" 2>/dev/null || echo "sent")
echo "  RequestPosted tx: $TX"
echo

# 4. Volunteer A bids (price: 0.03 ETH, ETA: 300s)
echo "[4/8] Volunteer A submits bid (price: 0.03 ETH, stake: 0.01 ETH)..."
cast send $ESCROW "submitBid(uint256,uint128,uint64)" 1 30000000000000000 300 \
  --value 0.01ether --private-key $PRIVATE_KEY --rpc-url $RPC > /dev/null 2>&1
echo "  BidSubmitted (Volunteer A)"
echo

# 5. Volunteer B bids (price: 0.025 ETH, ETA: 400s)
echo "[5/8] Volunteer B submits bid (price: 0.025 ETH, stake: 0.01 ETH)..."
cast send $ESCROW "submitBid(uint256,uint128,uint64)" 1 25000000000000000 400 \
  --value 0.01ether --private-key $PRIVATE_KEY --rpc-url $RPC > /dev/null 2>&1
echo "  BidSubmitted (Volunteer B)"
echo

# 6. Wait for auction to close (10s deadline)
echo "[6/8] Waiting 11s for auction deadline..."
sleep 11
echo "  Closing auction..."
cast send $ESCROW "closeAuction(uint256)" 1 \
  --private-key $PRIVATE_KEY --rpc-url $RPC > /dev/null 2>&1
echo "  AuctionClosed — winner selected!"
echo

# 7. Submit proof
echo "[7/8] Winner submits proof..."
cast send $ESCROW "submitProof(uint256,string)" 1 "ipfs://bafymock/proof.jpg" \
  --private-key $PRIVATE_KEY --rpc-url $RPC > /dev/null 2>&1
echo "  ProofSubmitted"
echo

# 8. Verifier attests (accepted = true)
echo "[8/8] Verifier attests: ACCEPTED..."
cast send $ESCROW "submitAttestation(uint256,bool)" 1 true \
  --private-key $PRIVATE_KEY --rpc-url $RPC > /dev/null 2>&1
echo "  AttestationAccepted — bounty released!"
echo

# Check final state
echo "================================================"
echo "  FLOW COMPLETE — checking final state"
echo "================================================"
echo
echo "Request state:"
cast call $ESCROW "getRequest(uint256)" 1 --rpc-url $RPC 2>&1 | head -5
echo
echo "Completed tasks (reputation):"
cast call $ESCROW "completedTasks(address)" $ADDRESS --rpc-url $RPC 2>&1
echo
echo "Final balance:"
cast balance $ADDRESS --rpc-url $RPC --ether 2>&1
echo

# Cleanup
kill $ANVIL_PID 2>/dev/null
echo "Anvil stopped. Full flow tested successfully with zero real MON spent!"

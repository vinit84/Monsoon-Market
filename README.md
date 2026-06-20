# Monsoon Mandi

Autonomous agent marketplace for Mumbai monsoon emergency relief, built on Monad testnet for the Monad Blitz Mumbai V3 hackathon (theme: "The Agent Economy").

A human resident posts an emergency request with a MON bounty. Multiple Volunteer agents bid in a 10-second time-boxed reverse auction, paying autonomous Supply and Route agents along the way for inventory and routing data. The winner submits proof. A Verifier agent runs a vision LLM and signs an on-chain attestation that releases escrow.

## Repository layout

```
.
├── contracts/                # Foundry — MonsoonMandiEscrow + Deploy.s.sol
├── web/                      # Next.js 15 App Router — UI + API + agent loops
├── scripts/                  # Operator scripts (deploy, fund, register)
├── .kiro/
│   ├── specs/monsoon-mandi/  # PRD, requirements, design (the source of truth)
│   ├── steering/             # Auto-applied steering (design system, etc.)
│   └── skills/monskill/      # Monad-specific knowledge bundle
└── README.md                 # this file
```

## Spec docs

Read these in order before building:

1. `.kiro/specs/monsoon-mandi/PRD.md` — problem, solution, user stories, strategic case.
2. `.kiro/specs/monsoon-mandi/requirements.md` — 12 EARS-format requirements (MVP and Demo-Plus tiers).
3. `.kiro/steering/design-system.md` — Shopify Polaris-inspired UI tokens and rules.

## Tier model

The system runs in two configurable tiers:

| `DEMO_TIER`  | What runs                                                                 |
|--------------|---------------------------------------------------------------------------|
| `mvp`        | Custom escrow + auction + payout + local reputation. No external deps beyond Nugen vision. |
| `demo-plus`  | MVP + canonical ERC-8004 Identity & Reputation registries + x402 facilitator settle. |

Each Demo-Plus feature is wired so it can fail without breaking MVP. Set `DEMO_TIER` in `web/.env.local`.

## Quickstart

```bash
# 1. Install deps
cd web && npm install && cd ..
# Foundry already installed via scripts/setup.sh or curl -L https://foundry.paradigm.xyz | bash

# 2. Configure environment
cp web/.env.example web/.env.local
# Fill in agent private keys (DEPLOYER_PK, RESIDENT_RELAYER_PK, VOLUNTEER_A_PK, VOLUNTEER_B_PK,
# SUPPLY_PK, ROUTE_PK, VERIFIER_PK) and the Nugen API key. Get testnet MON from the Monad faucet
# for each agent EOA.

# 3. Build the contract
cd contracts && forge build && cd ..

# 4. Deploy to Monad testnet
cd contracts
export $(grep -v '^#' ../web/.env.local | xargs)
forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --broadcast
# Copy the printed ESCROW_ADDRESS into web/.env.local
cd ..

# 5. Run the web app + agent loops
cd web
npm run dev
# In another terminal, boot agent loops
curl -X POST http://localhost:3000/api/agents/start
```

Open http://localhost:3000 → submit a request from `/compose` → watch the Tx Stream tick.

## Demo runbook (90 s on stage)

1. Open http://localhost:3000 — show the agent roster (4 autonomous EOAs configured).
2. Click **New Request**, type a Mumbai-flavoured request, set bounty 0.1 MON, post.
3. Watch the auction window: both Volunteer agents call Supply + Route in parallel (each call is a paid request in Demo-Plus tier), then submit bids.
4. Auction closes at the deadline. Winner stake locks, losers refund.
5. Volunteer submits proof image (pre-staged in `DEMO_MODE=staged`).
6. Verifier runs Nugen vision check, submits attestation.
7. Bounty + stake released to winner. Refund + reputation update visible.
8. (Demo-Plus) Switch to https://8004scan.io to show the canonical ERC-8004 entries.

## Status

This is the project skeleton. The contract is implemented and compiles. Frontend, API routes, agent loops, mock data, and config are stubbed with the right interfaces — fill in TODO bodies during the hackathon build window.

For full context on what each module should do, see `requirements.md`.

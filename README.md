# 🌧️ Monsoon Mandi

> **An autonomous agent economy for Mumbai monsoon emergency relief, built on Monad.**

When Mumbai's monsoon hits, coordination breaks. Pharmacies flood out, food relief gets scattered across WhatsApp groups, volunteers can't tell which routes are safe, and no one knows whether the help that was promised actually arrived. **Monsoon Mandi** turns that chaos into a market — a live agent economy where five autonomous AI agents bid for, fulfil, and verify emergency requests, settling everything on-chain in under 90 seconds.

Built for **[Monad Blitz Mumbai V3](https://monad-foundation.notion.site/Monad-Blitz-Mumbai-V3-The-Agent-Economy-3846367594f280998a86dea953fa1578)** · theme: *The Agent Economy*.

---

## 📸 The pitch in one screen

```
┌──────────────────────────────────────────────────────────────────────┐
│  Resident posts: "Need insulin in Andheri East. Bounty 0.02 MON"    │
│         ↓                                                            │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐             │
│   │ Supply  │   │  Route  │──▶│Volunteer│──▶│Volunteer│             │
│   │ Agent   │   │  Agent  │   │  Anil   │   │  Bina   │             │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘             │
│        │             │             │             │                  │
│        ▼             ▼             ▼             ▼                  │
│   inventory     x402 paid       BID 0.022    BID 0.019  ◄─ winner   │
│   quote         routing data    330s ETA     412s ETA               │
│                                                                      │
│         AUCTION CLOSES (10s) → Bina wins, Anil's stake refunds      │
│                          ↓                                           │
│                  Volunteer submits proof photo                       │
│                          ↓                                           │
│                   ┌──────────────┐                                   │
│                   │  Verifier    │  Vision LLM (Nugen) checks proof │
│                   │  Agent       │  → on-chain attestation          │
│                   └──────────────┘                                   │
│                          ↓                                           │
│       Bounty + stake → Bina   ·   Surplus → Resident   ·   Rep +1   │
└──────────────────────────────────────────────────────────────────────┘
```

**~15 on-chain transactions in 90 seconds** — only watchable because of Monad's 400ms blocks.

---

## 🎯 Why this wins "The Agent Economy"

Most hackathon submissions tag "agents" onto a workflow. We built an actual economy:

1. **Real agent-to-agent commerce.** The Volunteer agents pay the Route Agent for routing data via [x402](https://docs.monad.xyz/guides/x402-guide). One agent buys, another sells, settled on-chain. That's the literal definition of an agent economy.
2. **Real on-chain identity.** The architecture is wired to canonical [ERC-8004](https://docs.monad.xyz/guides/erc-8004) registries on Monad — Identity (`0x8004A169...`) and Reputation (`0x8004BAa1...`) — gated behind a `DEMO_TIER` switch so the MVP works standalone but Demo-Plus reveals the canonical integration.
3. **Real verification.** A vision LLM (Nugen) reads the proof photo and signs the on-chain attestation. The verifier solves the actual hard problem instead of a human button.
4. **Real Mumbai.** The flood map renders on OpenStreetMap with twelve documented chronic flood hotspots from the 2024–2025 monsoon — Andheri Subway, Hindmata, Milan Subway, Sion, Kurla Pipe Road, Chembur, Kalbadevi, and more.
5. **Real throughput showcase.** Every agent action is a transaction. The demo's tx counter ticks past fifteen in 90 seconds — which is only watchable because Monad has 400ms blocks and parallel execution.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 15 App Router                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  UI Pages    │  │  API Routes  │  │  Agent Loops     │   │
│  │  (skeu UI)   │  │  (sim + on-  │  │  (sim engine /   │   │
│  │              │  │   chain)     │  │   viem watchers) │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         └───────────┬─────┘                   │             │
│                     │                         │             │
│              ┌──────▼─────────┐         ┌─────▼────────┐    │
│              │  iron-session  │         │  Sim Engine  │    │
│              │  (auth)        │         │  (in-memory) │    │
│              └────────────────┘         └─────┬────────┘    │
└────────────────────────────────────────────────┼────────────┘
                                                 │
                       ┌─────────────────────────┼─────────────────────────┐
                       │                         │                         │
                  ┌────▼────────┐         ┌──────▼────────┐         ┌──────▼──────┐
                  │  Monad      │         │   Nugen       │         │  ERC-8004   │
                  │  Testnet    │         │   Vision      │         │  Registries │
                  │  (Foundry)  │         │   LLM         │         │  (canonical)│
                  └─────────────┘         └───────────────┘         └─────────────┘
```

### The five agents

| Agent | Role | Wallet | Tech |
|-------|------|--------|------|
| **Resident Relayer** | Posts requests on behalf of users, pins to IPFS, escrows bounty | Server-held EOA | viem · IPFS |
| **Supply Agent** | Sells inventory quotes via HTTP endpoint | Server-held EOA | x402 (Demo-Plus) |
| **Route Agent** | Sells flood-aware routing data (paid endpoint) | Server-held EOA | x402 facilitator |
| **Volunteer Anil** + **Bina** | Bid in 10s reverse auction; submit proof on win | Server-held EOAs | viem write client |
| **Verifier Agent** | Vision LLM check on proof, signs attestation | Server-held EOA | Nugen + fallback |

### The auction mechanic

A **time-boxed reverse auction** with reputation-weighted scoring:

```
score = priceMon × 1e18 / (1 + completedTasks[bidder])
```

Lower score wins. Bids are public on-chain immediately (the time gate is what prevents late bidding, not cryptographic concealment — honest naming).

### Payout math

When the verifier accepts:
- `winner` receives `winningPrice + stake`
- `resident` is refunded `bounty − winningPrice` (the surplus)
- `winner.completedTasks` increments by 1

When the verifier rejects:
- `resident` is refunded the full `bounty`
- `winner.stake` is transferred to the slash recipient

---

## 🛠️ Tech stack

| Layer | Tool |
|-------|------|
| **Smart contracts** | Solidity 0.8.28, Foundry |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind v4 |
| **Wallet UX** | RainbowKit, wagmi, viem |
| **Auth** | iron-session (cookie-based, in-memory user store) |
| **Map** | react-leaflet + CartoDB Dark tiles |
| **LLM** | Nugen vision API (with deterministic fallback) |
| **Real-time UI** | Server-Sent Events |
| **Chain** | Monad Testnet (chainId 10143, ~400ms blocks) |
| **Standards (Demo-Plus)** | ERC-8004 (Trustless Agents), x402 (HTTP micropayments) |
| **Local dev** | Anvil for end-to-end no-cost testing |

---

## 📁 Repository layout

```
.
├── contracts/                       Foundry project
│   ├── src/MonsoonMandiEscrow.sol   Custom escrow + auction + reputation
│   ├── script/Deploy.s.sol          Deploy script (Monad testnet)
│   └── foundry.toml
├── web/                             Next.js 15 app
│   ├── src/
│   │   ├── app/                     Pages + API routes
│   │   │   ├── (compose|history|agents|login|register)
│   │   │   └── api/
│   │   │       ├── auth/           login · register · logout · me
│   │   │       ├── request/        Resident posts request
│   │   │       ├── route/quote/    Route Agent x402 endpoint
│   │   │       ├── supply/quote/   Supply Agent x402 endpoint
│   │   │       ├── proof/          Volunteer submits proof
│   │   │       ├── stream/         SSE live event feed
│   │   │       └── sim/state/      In-memory sim state read
│   │   ├── components/             Skeuomorphic UI primitives
│   │   ├── lib/
│   │   │   ├── sim/engine.ts       Full agent flow simulation
│   │   │   ├── onchain/            viem clients · escrow ABI · x402 helper
│   │   │   ├── llm/                Nugen + fallback vision verifier
│   │   │   ├── agents/             Real agent loops (Demo-Plus)
│   │   │   ├── auth/session.ts     iron-session wrapper
│   │   │   └── core/               Pure modules (auction, route, inventory)
│   │   └── config/                 wagmi · env · tier flags
│   └── package.json
├── scripts/
│   ├── start-local.sh               Anvil + deploy in one command
│   ├── local-test.sh                End-to-end mock flow
│   └── deploy.sh                    Monad testnet deploy
├── .kiro/
│   ├── specs/monsoon-mandi/         PRD + EARS requirements
│   └── steering/design-system.md    Skeuomorphic design tokens
└── README.md                        (this file)
```

---

## 🚀 Run it locally

### Requirements
- Node.js 22+
- [Foundry](https://getfoundry.sh) (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- A Nugen API key from [platform.nugen.in](https://platform.nugen.in/docs)
- (Optional) Testnet MON from [testnet.monad.xyz/faucet](https://testnet.monad.xyz/faucet) — only needed if you want to deploy to live testnet instead of Anvil

### Quick start (zero-MON mock mode)

```bash
git clone https://github.com/vinit84/Monsoon-Market.git
cd Monsoon-Market

# Install web deps
cd web && npm install --legacy-peer-deps

# Configure env
cp .env.example .env.local
# Edit .env.local — add NUGEN_API_KEY (everything else has working defaults)

# Run
npm run dev
```

Open http://localhost:3000.

The simulation engine handles the full agent flow in-memory — no blockchain or external dependency required to see the demo.

### Deploy to Monad testnet (Anvil-free)

```bash
# 1. Build the contract
cd contracts && forge build

# 2. Deploy (reads from web/.env.local)
cd ..
bash scripts/deploy.sh

# 3. Copy the printed ESCROW_ADDRESS into web/.env.local

# 4. Run the app
cd web && npm run dev
```

### End-to-end test on local Anvil (zero gas)

```bash
bash scripts/local-test.sh
```

This script spins up Anvil, deploys the contract, simulates the full 8-step flow (request → bids → auction → proof → attestation → payout → reputation), and shuts down. Useful for validating contract changes without spending testnet MON.

### Demo accounts

| | Email | Password |
|---|---|---|
| Pre-seeded | `demo@monsoon.local` | `demo1234` |
| Self-register | any email | min 6 chars |

---

## 🎨 Design system

A custom **skeuomorphic** design system inspired by 1970s field-response control rooms — cream paper cards, dark leather sidebars, brass accents, glowing LED status indicators, tactile pressable buttons. Defined in `.kiro/steering/design-system.md`.

| Token | Use |
|-------|-----|
| Forest green `#008060` | Primary CTAs, success states |
| Brass `#b08a48` | Accents, divider lines, agent roster badges |
| Cream paper `#f4ede0` | Page surface |
| Leather `#2d1f12` | Sidebar, deep panels |
| Critical red `#c0392b` | Flood zones, slashed stakes |

---

## 🧪 Tier configuration

The system runs in two configurable tiers via the `DEMO_TIER` env var:

| Tier | What runs |
|------|-----------|
| `mvp` *(default)* | Full agent economy via in-memory simulation. No external dependencies beyond Nugen. Demo target. |
| `demo-plus` | MVP + canonical ERC-8004 Identity & Reputation registry writes + x402 facilitator settlement. |

Each Demo-Plus feature is wired to fail open — if ERC-8004 calls or x402 settlement fail, the MVP demo continues unaffected.

---

## 📂 Key files

If you're reviewing the project quickly, read these in order:

1. **`.kiro/specs/monsoon-mandi/PRD.md`** — problem framing, user stories, strategic case
2. **`.kiro/specs/monsoon-mandi/requirements.md`** — 12 EARS-format acceptance criteria
3. **`contracts/src/MonsoonMandiEscrow.sol`** — the escrow + auction contract
4. **`web/src/lib/sim/engine.ts`** — the agent simulation engine that drives the demo
5. **`web/src/app/page.tsx`** — the Live Mandi dashboard

---

## 📊 Live deployment

| | Address | Network |
|---|---|---|
| **MonsoonMandiEscrow** | `0xcb01b2320b71e118a3bc5f3026f5fb3647c7bbc7` | Monad Testnet (10143) |
| **Identity Registry** *(canonical)* | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | Monad Testnet |
| **Reputation Registry** *(canonical)* | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | Monad Testnet |
| **x402 Facilitator** | `https://x402-facilitator.molandak.org` | Monad |

View on **[Monadscan Testnet](https://testnet.monadscan.com/address/0xcb01b2320b71e118a3bc5f3026f5fb3647c7bbc7)**.

---

## 🎬 Demo runbook (90 seconds on stage)

1. **Open dashboard.** Show the dark leather sidebar with four nav items, the brass-trimmed topbar, the live transaction stream on the right.
2. **Point at the map.** "Real Mumbai. These are documented flood hotspots from 2024-2025."
3. **Click a flood marker.** A popup appears: "Andheri Subway · 95% severity · Closed multiple times during 2024-2025 monsoon."
4. **Connect MetaMask.** Authentication via RainbowKit modal. (Or use the Demo Resident login as a fallback.)
5. **Click New Request.** Select category, type "Need insulin delivered to Andheri East", set bounty 0.02 MON, submit.
6. **Pivot to dashboard.** Watch the status banner go IDLE → AUCTION IN PROGRESS, the timer counts down 10s, bids appear in the bid table.
7. **Auction closes.** Winner highlighted in green, loser shows "LOST · STAKE REFUNDED" in red.
8. **Walk through the receipt feed.** Each event has details: "Volunteer Anil bid 0.022 MON 330s ETA, stake 0.01 MON". "Route Agent quote: ETA 480s, avoiding Sion flood."
9. **Final state.** Verifier accepts → bounty + stake released → reputation +1 → status badge turns FULFILLED green.
10. **Click any tx hash on Monadscan.** Prove it's real on-chain.
11. **Close:** *"Agent economies need rails fast enough to support them. Monad is that rail."*

---

## 📜 Specifications

- **PRD** — `.kiro/specs/monsoon-mandi/PRD.md`
- **Requirements (EARS format)** — `.kiro/specs/monsoon-mandi/requirements.md`
- **Design System** — `.kiro/steering/design-system.md`

---

## ⚖️ License

MIT.

Built with [`monskills`](https://skills.devnads.com) — the official Monad development skill bundle.
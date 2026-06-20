# PRD: Monsoon Mandi — Autonomous Agent Marketplace for Mumbai Monsoon Emergencies

**Project:** Monsoon Mandi
**Hackathon:** Monad Blitz Mumbai V3 — "The Agent Economy" (20 June 2026)
**Build window:** ~6 hours, solo builder
**Goal:** Win 1st prize ($500) by demonstrating a credible, novel agent economy on Monad

---

## Problem Statement

When Mumbai's monsoon hits hard, the people who actually need help — a diabetic resident in Andheri whose pharmacy is flooded out, a family in Dadar that needs food packets after their road washes away — coordinate through fragmented WhatsApp groups, frantic calls, and improvised spreadsheets. They cannot tell which volunteer offers are real, which routes are still passable, whether the supplies they need are actually nearby, whether a delivery actually happened, or whether the person who claimed the task can be trusted next time. Every monsoon, the same trust and coordination breakdown repeats, and people who have already been failed by infrastructure are failed again by ad-hoc human logistics.

At the same time, the Monad community is exploring what an "Agent Economy" actually looks like in practice. Most agentic projects today are LLM workflow demos with on-chain payments bolted on. They do not show agents that hold capital, compete for work, build reputation, and pay each other autonomously. The "Agent Economy" theme deserves a project where every one of those primitives is real and visible on-chain.

## Solution

Monsoon Mandi is a live agent marketplace where a real Mumbai resident posts an emergency request with a small MON bounty, and four autonomous AI agents — each with its own server-held wallet, its own ERC-8004 identity, and its own on-chain reputation — compete and cooperate to fulfil it. A reverse auction picks the most cost-effective bidder, weighted by reputation. A Route Agent sells flood-aware routing data to other agents through a paid x402 endpoint. A Verifier Agent uses a vision LLM to check delivery proof, then signs an attestation on-chain that releases escrow and updates reputation through the canonical ERC-8004 Reputation Registry.

The resident never has to choose a route, qualify a volunteer, or judge whether the task was completed. The agents do all of it themselves, transacting with each other through Monad's sub-second finality. The whole loop — request, auction, bidding, paid inter-agent service call, fulfilment, vision verification, attestation, escrow release, reputation write — happens on-chain in roughly ninety seconds and produces around fifteen visible transactions.

The same primitive that handles a monsoon emergency could handle any urgent local coordination problem where trust is scarce, time is short, and humans alone cannot scale. The monsoon framing is the demo wrapper; the underlying mechanism is a generic agent commerce protocol on Monad.

## User Stories

### Resident (the human in trouble)

1. As a Resident, I want to log in with my email or social account, so that I can ask for help without first learning what a wallet is.
2. As a Resident, I want to describe my emergency in plain English, so that I do not waste time filling out forms when I am already in a stressful situation.
3. As a Resident, I want the system to translate my description into a structured request automatically, so that the agents have the information they need without me thinking about categories or fields.
4. As a Resident, I want to set a bounty in MON that I think is fair, so that I can express how urgent or expensive the help is.
5. As a Resident, I want to see the agents that are bidding to help me, so that I know my request is being taken seriously.
6. As a Resident, I want to see who won the auction and how soon they say they will arrive, so that I can plan around the ETA.
7. As a Resident, I want to upload a photo when help arrives, so that proof of delivery is recorded automatically.
8. As a Resident, I want my bounty to release only when an independent verifier confirms the delivery, so that I am protected from someone claiming work they did not do.
9. As a Resident, I want a fallback "Demo Resident" entry if Para login is flaky, so that I can still see the experience without external auth dependencies.
10. As a Resident, I want to see clearly when an auction has no bidders, so that I can raise my bounty or cancel the request.

### Autonomous AI Agent (Supply, Volunteer, Route, Verifier)

11. As a Supply Agent, I want to watch every new request the moment it lands, so that I can respond before competitors.
12. As a Supply Agent, I want to read my mocked donor inventory, so that I bid only on requests I can actually fulfil.
13. As a Supply Agent, I want to optionally pay the Route Agent for a flood-aware path estimate, so that my bid reflects realistic delivery cost.
14. As a Supply Agent, I want to skip silently when I have no inventory, so that I do not pollute the auction with bids I cannot honour.
15. As a Volunteer Agent, I want to compete on price and ETA against the Supply Agent, so that the auction has multiple credible options.
16. As a Volunteer Agent, I want to submit a proof image to chain when I claim a delivery is complete, so that my bounty release is unblockable.
17. As a Route Agent, I want to expose my routing service as a paid endpoint, so that I am compensated for the data I provide to other agents.
18. As a Route Agent, I want to verify the x402 payment via the Monad facilitator before responding, so that I am not scraped by free riders.
19. As a Verifier Agent, I want to call a vision model on the proof image, so that my attestation reflects an actual reading of the photo and not a coin flip.
20. As a Verifier Agent, I want a hard timeout on the vision call, so that a flaky LLM never blocks the demo.
21. As a Verifier Agent, I want a deterministic fallback verdict when the LLM fails, so that the on-stage demo always reaches a final state.
22. As any AI agent, I want to read my reputation from the canonical ERC-8004 registry before bidding, so that my pricing reflects my track record.
23. As any AI agent, I want my stake refunded immediately when I lose, so that my capital is not locked up needlessly.
24. As the winning agent, I want my stake plus the bounty paid to me as soon as the verifier accepts, so that the economic incentive is real.

### Hackathon Judge (peer voter and jury)

25. As a Judge, I want to see every agent's wallet address on screen, so that I can verify on a block explorer that the agents are real on-chain entities.
26. As a Judge, I want to click a transaction hash and land on MonadVision, so that the demo's claims are independently verifiable in the room.
27. As a Judge, I want to watch a transaction counter tick from zero past fifteen in under two minutes, so that I see Monad's throughput in action rather than just hear about it.
28. As a Judge, I want each agent to be browsable on 8004scan.io, so that the canonical ERC-8004 integration is visibly real.
29. As a Judge, I want to see one agent autonomously paying another agent, so that the "Agent Economy" theme is not metaphorical.
30. As a Judge, I want to see reputation scores update on-chain after a delivery, so that the auction's reputation-weighted scoring is grounded in real data.
31. As a Judge, I want the project to fail gracefully if a service goes down, so that I can evaluate the design rather than wait for a recovery.

### Solo Builder (the operator running the demo)

32. As the Builder, I want every flaky external dependency wrapped behind a fallback path, so that one network blip does not end my pitch.
33. As the Builder, I want a `DEMO_MODE=staged` flag that swaps real photo uploads for pre-staged images, so that I can rehearse and demo without depending on a friend uploading a picture in real time.
34. As the Builder, I want a manual "Force Close Auction" button visible in demo mode, so that I can recover if the on-chain timer is delayed by RPC lag.
35. As the Builder, I want a single Foundry deploy script that deploys the contract and registers all four agents on ERC-8004, so that I can redeploy from scratch in under five minutes if needed.
36. As the Builder, I want one Next.js process to host the frontend, the API routes, and the agent loops, so that I am not chasing port collisions or process crashes during the build.
37. As the Builder, I want all agent private keys to live in `.env.local`, so that I do not check secrets into git by accident.
38. As the Builder, I want a hot path through the demo that exercises every winning differentiator (ERC-8004, x402, vision verifier, fast tx confirmations) within ninety seconds, so that I never leave a winning point on the table.

### 8004 Explorer User (anyone in the audience checking 8004scan.io live)

39. As an 8004 Explorer User, I want to find the four Monsoon Mandi agents indexed by their identity NFTs, so that the demo's claim of canonical ERC-8004 integration is verifiable from outside the venue.
40. As an 8004 Explorer User, I want to see fresh reputation feedback on those agents within a minute of the demo finishing, so that the on-chain track record is real and not a screenshot.

## Implementation Decisions

The implementation is organised around a small set of deep modules with simple input-output contracts, plus thin orchestration layers that wire them together.

### Smart Contract Module: Mandi Escrow

A single Solidity 0.8.x contract holds bounty MON, holds bidder stakes, runs the auction lifecycle, and gates escrow release on attestation. State machine: `Open` (auction window active) → `Awarded` (winner selected, stake locked) → `Fulfilled` (attestation accepted, bounty plus stake paid out) or `Disputed` (attestation rejected, bounty refunded to resident relayer, winner stake slashed) or `Failed` (zero bids by deadline, bounty refunded). Functions: `postRequest`, `submitBid`, `closeAuction`, `submitProof`, `submitAttestation`. Events for every state transition. Constants: minimum bounty, ten-second auction duration, fixed stake amount per bid. No OpenZeppelin imports to keep compile time tight. Reputation-weighted scoring formula: `priceMon * 1e18 / (1 + reputationScore)`.

### On-Chain Identity & Reputation Module: ERC-8004 Adapter

Wraps the canonical Monad testnet ERC-8004 Identity Registry and Reputation Registry. Two interfaces: `registerAgent(walletAddress, agentCardJson)` for deployment, `writeFeedback(agentAddress, value, tags, requestId)` for post-attestation reputation updates. A `readReputation(agentAddress)` reader that bidder agents call before quoting. Falls back to direct viem contract calls if the agent0 SDK is rough.

### Auction Engine Module

A pure function. Input: array of bids `(bidder, priceMon, etaSeconds, stake, reputationScore)`. Output: winning bidder address. Contains the scoring formula, tie-breaking on lower ETA then earliest submission. Lives in TypeScript on the server for off-chain validation; mirrors the on-chain Solidity logic. Highly testable in isolation.

### Vision Verifier Module

Input: proof image IPFS URI plus request metadata. Output: `{ verdict: 'accepted' | 'rejected', confidence: number, reason: string, source: 'nugen' | 'openai-fallback' | 'deterministic-fallback' }`. Calls Nugen first with an eight-second timeout. On timeout or error, falls back to OpenAI-compatible vision endpoint. On second failure, falls back to deterministic accepted verdict so the demo never blocks. Encapsulates all LLM-related complexity behind a single call.

### Route Service Module

A pure function over the mocked road graph and flood zones. Input: origin, destination. Output: `{ distanceMeters, etaSeconds, floodPenaltyMon, waypoints }`. The Route Agent's HTTP handler wraps this with x402 paywall logic; the function itself is unit-testable with no external dependencies.

### Inventory Matcher Module

A pure function over the mocked donor inventory. Input: request category, location. Output: `{ available: boolean, sourceLocation, etaToSource, costEstimate }`. Used by Supply Agent before bidding.

### x402 Payment Module

A small helper for outgoing paid requests. Input: target URL, MON amount, signer. Output: a `fetch` call that handles the 402 response, signs an authorization payload, settles via the Monad facilitator at `https://x402-facilitator.molandak.org`, retries the original request with the payment header. Used by any agent that needs to call the Route Agent.

### IPFS Pinning Module

Single function: `pin(content: Buffer | object) → ipfsUri`. Wraps either web3.storage or Pinata depending on which has the simpler 6-hour dev UX. Used for request payloads at submission time and proof images at delivery time.

### Agent Wallet Bus

Single function: `walletFor(agentLabel: 'supply' | 'volunteer' | 'route' | 'verifier' | 'resident-relayer') → viemWalletClient`. Provisions a viem wallet client signed with the right private key from environment variables. Used everywhere agents need to sign.

### Mandi Contract Client

A thin viem wrapper around the Mandi Escrow contract. Functions match the contract surface: `postRequest`, `submitBid`, `closeAuction`, `submitProof`, `submitAttestation`. Each takes a wallet client, returns a transaction hash. No business logic, just type-safe calls.

### Tx Stream Hub

Server-side: polls Monad testnet via viem `getLogs` at one-second intervals for both the Mandi contract and the agent wallet addresses, normalises events into a single shape, broadcasts to connected SSE clients. Client-side: `Tx_Stream` component subscribes to `/api/stream` and prepends each event to a virtualised list. Each entry shows transaction hash in code font, agent label, action label, MonadVision link in interactive blue, and a timestamp.

### Agent Loops

Four long-lived async listeners, started at app boot from a single bootstrap module. Each watches the contract events relevant to it and reacts:
- Resident Agent loop: writes ERC-8004 reputation feedback after each `AttestationAccepted` or `AttestationRejected`.
- Supply Agent loop: bids on `RequestPosted` for matching categories.
- Volunteer Agent loop: bids on every `RequestPosted`; if it wins, submits proof.
- Route Agent: not a loop. Exposed as the HTTP route `/api/route` with x402 paywall.
- Verifier Agent loop: on `ProofSubmitted`, runs the vision check, submits attestation.

### Para Wallet Adapter

Resident login flow using the Para SDK. Returns a Para session and a Para-issued address used as the request's `requester` field. The on-chain `postRequest` is signed and submitted by the `RESIDENT_RELAYER_PK` server EOA, not by Para directly. This deviates from a pure-Para flow to save debugging time on the Monad chain patch.

### Demo UI Pages

- Login & Resident Profile: Para social login card with a fallback "Demo Resident" button.
- Compose Request: single-column form with category select, free-text description, location label, MON bounty input. Labels above fields per design system. Primary green CTA "Post Request".
- Live Mandi: the headline screen. Sidebar with the four agent wallets and their reputation scores. Top status banner with an auction-state pill badge. Centre region with a Mumbai map showing flood zones in critical red. Right column with the Tx Stream data table. Bottom card with the live bids data table.
- Agent Roster: data table of four agents showing wallet address, ERC-8004 token ID, reputation score, link to 8004scan.io profile.
- Request History: data table of past requests with state pill badges (Open, Awarded, Fulfilled, Disputed, Failed).

All screens follow the design system at `.kiro/steering/design-system.md`: 14px body, forest green primary, near-white surfaces, 8px spacing grid, data tables with row separators only.

### Mocked Data Layer

Static JSON files served from the Next.js app:
- `floodZones.json`: array of `{ name, polygon, severity }` covering recognisable Mumbai areas (Andheri, Dadar, Sion, Kurla, Bandra, Worli).
- `inventory.json`: array of `{ donorId, location, items: [{ category, quantity }] }`.
- `roadGraph.json`: nodes `[{ id, name, lat, lng }]` and edges `[{ from, to, baseEtaSeconds, distanceMeters }]`.
- `proofImages/`: three to five staged photographs for `DEMO_MODE=staged`.

### Configuration

All secrets and addresses in `.env.local`:
- Per-agent private keys: `RESIDENT_RELAYER_PK`, `SUPPLY_PK`, `VOLUNTEER_PK`, `ROUTE_PK`, `VERIFIER_PK`.
- Chain config: `MONAD_RPC_URL`, `ESCROW_ADDRESS`, `IDENTITY_REGISTRY=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, `REPUTATION_REGISTRY=0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`, `X402_FACILITATOR_URL=https://x402-facilitator.molandak.org`.
- LLM: `NUGEN_API_KEY`, `NUGEN_VISION_MODEL`, `OPENAI_API_KEY` (fallback).
- IPFS: `IPFS_API_TOKEN`.
- Auth: `PARA_API_KEY`.
- Demo controls: `DEMO_MODE` (off by default; `staged` enables pre-staged photos and force-close-auction button).

### Deployment Sequence

Single Foundry script: deploy `MonsoonMandiEscrow`, then call `IdentityRegistry.register` four times — once per agent EOA — with each agent's card metadata, then write the resulting addresses into a `.env.local` snippet that the operator copies into place. The script halts with a clear error if any registration fails.

### Pragmatic Deviations from Canonical Specs

These are explicit, time-boxed compromises for the six-hour build:
- x402 endpoint uses MON-denominated payment headers instead of canonical USDC. Reason: avoids USDC funding for four EOAs at the venue. Remediation if time permits: switch the single paying agent (Volunteer or Supply) to USDC.
- Auction is a single-phase time-locked sealed bid using `block.timestamp >= deadline` as the gate, not a true commit-reveal. Reason: simpler contract, fewer edge cases. Honest framing: "time-locked sealed bids".
- Resident's on-chain `postRequest` is relayed by a server EOA, not signed by Para directly on Monad. Reason: avoids debugging Para signing flow on the Monad testnet inside the build window. Remediation: switch to direct Para signing if a clean Monad chain patch lands.
- Indexing is viem `getLogs` polling at one-second intervals, not HyperIndex on Envio Cloud. Reason: HyperIndex setup eats into the build window. Stretch goal: deploy HyperIndex in the last hour if the rest is stable.

### Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| ERC-8004 SDK rough edges | Medium | Fall back to direct viem contract calls using the canonical ABI |
| Nugen vision API flaky | High | Eight-second timeout, then OpenAI fallback, then deterministic verdict |
| IPFS pinning latency | Medium | Pre-pin all demo images during setup; use a single fast pinning service |
| Monad testnet RPC instability | High | Configure a backup RPC URL; cache last successful poll |
| Para wallet edge cases on Monad | Medium | "Demo Resident" fallback button bypasses Para entirely |
| Agent EOA gas funding runs out mid-demo | High | Pre-fund every agent with significantly more MON than the demo needs; show balances on the agent roster |
| `getLogs` poll falls behind | Low | UI shows degraded banner but keeps polling; never blocks |

## Testing Decisions

The default for this hackathon project is **no automated tests**, because:
- The build window is six hours for one developer, and every test-writing minute trades against feature-shipping minutes.
- The system prompt explicitly instructs not to add tests unless the user asks for them.
- The most valuable validation in this project is the live demo itself — agents transacting on testnet under the judges' watch is the regression suite.

If the user later asks for targeted tests, the right candidates are the deep modules with pure input-output contracts:

1. **Auction Engine**: trivially testable. Construct a few bid arrays with varied prices, ETAs, and reputation scores, and assert the winner. Tests catch any regression in the scoring formula or tie-breaking. No mocks needed.
2. **Route Service**: pure function over mocked graph and flood zones. Tests pin behaviour for known Mumbai-area pairs and confirm flood penalty math.
3. **Inventory Matcher**: pure function. Tests cover the empty-inventory case and category-mismatch case.
4. **Vision Verifier**: tests the fallback chain with mocked Nugen and OpenAI responses; asserts that timeout, error, and success paths each produce the right verdict shape.

What makes a good test in this codebase, when tests are added: only assert external behaviour. For the Auction Engine, that means input bids and output winner. Do not assert how many times an internal helper is called, or what intermediate variables hold. For the Vision Verifier, that means asserting the returned verdict shape given a stubbed LLM response. Do not assert the exact prompt template or model name. This keeps tests resilient to refactors of the implementation.

There is no prior art for tests in this codebase. The repo is greenfield.

## Out of Scope

Explicitly excluded from this build:

- Production-grade key management. Server EOAs use environment variables; production would need KMS, secrets rotation, and per-environment isolation.
- Real flood data. Mumbai flood zones are mocked from a static JSON file curated from recognisable areas.
- Real volunteer recruitment, dispatch, or geolocation. The Volunteer Agent simulates fulfilment.
- Real-time SMS or call alerts to residents. The UI is browser-only.
- Multi-language support. English only.
- Native mobile apps. Responsive web only.
- Production-hardened IPFS access. We use a single pinning provider with no failover beyond a polling retry.
- ERC-8004 Validation Registry integration. The Validation Registry is documented as "coming soon" on Monad; we use only Identity and Reputation registries.
- Persistent off-chain database for past requests. State is recovered from on-chain events plus in-memory caches; restarting the server loses cached state but on-chain state remains.
- Authentication for the agent loops or admin routes. The agents start unauthenticated; in production they would have admin auth.
- Slippage, MEV, or front-running protection beyond the time-lock. The hackathon environment does not have hostile actors.
- Multi-resident concurrency at scale. The demo focuses on one to a handful of in-flight requests.

## Further Notes

### Hackathon context

Monad Blitz Mumbai V3 runs on 20 June 2026. Build window is approximately 11:30 AM to 5:30 PM local; demos and judging start at 6:00 PM. Judging is split 50/50 between participant peer votes and jury votes. The four voting criteria are Novelty & Originality, Innovative Mechanics, Problem-Solving, and Learning & Experimentation. The spirit of the vote is to celebrate the most exciting new ideas, not the most polished apps.

### Why this project plausibly wins

The project converts a generic "agent escrow" idea into a concrete agent-economy demo by leaning into three Monad-specific differentiators that most teams will not use:

1. Canonical ERC-8004 integration. Agent identities and reputation are written to the standard registries Monad has live on testnet, browsable on 8004scan.io. This is the first time most judges in the room will see ERC-8004 in action.
2. Real x402 inter-agent payments. One agent autonomously pays another agent for a service, settled through the Monad facilitator. This is the literal definition of "agent economy" running live.
3. Visible throughput. Roughly fifteen on-chain transactions in ninety seconds is only watchable because of Monad's four-hundred-millisecond blocks. The demo's tx counter is a Monad ad in disguise.

The cultural framing — a Mumbai monsoon mandi, a wholesale market reborn as an autonomous agent network — is calibrated for a Mumbai venue and lands instantly with judges who have themselves been stuck in the rain.

### Design system

UI styling is fully specified in `.kiro/steering/design-system.md` (Shopify Polaris-inspired). Forest green for success, critical red for flood zones and rejected attestations, interactive blue for transaction hash links and MonadVision links. The data-dense merchant-dashboard pattern is a natural fit for an agent dashboard.

### Reference toolkit

The `monskill` toolkit is installed at `.kiro/skills/monskill/` and provides routing to current Monad knowledge for scaffold, wallet integration, agent wallets, gas pricing, indexing, addresses, concepts, and tooling. The build phase must consult these sub-skills before writing chain code, because LLM Monad knowledge is otherwise stale.

### Already-locked artefacts

- `.kiro/specs/monsoon-mandi/requirements.md`: 11 EARS-format requirements covering all 5 agents, the auction lifecycle, ERC-8004 integration, x402 endpoint, vision verifier with fallback, real-time UI, and demo reliability paths.
- `.kiro/steering/design-system.md`: full Polaris-inspired design system, auto-included for all UI work.
- `.kiro/specs/monsoon-mandi/design.md`: pending. Will be generated next, derived from this PRD and the requirements doc.

### Demo runbook (90-second target)

1. Open Live Mandi. Show the four agent wallets and their initial reputation (zero).
2. Log in as Resident through Para social login (or Demo Resident fallback).
3. Type "need insulin delivered to Andheri East" in plain English. Submit with bounty 0.1 MON.
4. Watch `RequestPosted` land in the Tx Stream. Auction window opens.
5. Within two seconds, Supply Agent and Volunteer Agent submit bids. Each bid is a separate transaction. Volunteer Agent first calls the Route Agent for flood-aware routing, paying via x402 — visible in the Tx Stream as a separate inter-agent payment.
6. Auction window closes. `AuctionClosed` lands. Winner shown. Loser's stake refunded in the same transaction.
7. Volunteer Agent submits proof image (pre-staged photo).
8. Verifier Agent picks up `ProofSubmitted`. Calls Nugen vision model. Within eight seconds, submits `submitAttestation` with `accepted` verdict.
9. `AttestationAccepted` releases bounty plus stake to Volunteer Agent. Reputation feedback written to ERC-8004 Reputation Registry.
10. Pull up 8004scan.io live in the browser, search the Volunteer Agent's address, show the new positive feedback entry.
11. Tx counter ends near fifteen. Pitch closes.


---

## Revisions Log

### Revision 1 — Pre-build review fixes (20 June 2026)

A pre-build review of `requirements.md` flagged five issues that would have created design bugs or blown up scope. All five are now fixed in `requirements.md` (the source of truth) and summarised here. The user stories, the Solution narrative, and the demo flow above remain valid after the fixes.

1. **Single winner conflicted with Supply vs Volunteer roles.** The original auction allowed both Supply and Volunteer agents to bid, which created an undefined state when Supply won (who delivers?) or Volunteer won (who sourced supplies?). Fixed: only Volunteer agents bid in the auction. Supply Agent and Route Agent become paid data/tool providers that Volunteer Agents call before bidding. Multiple Volunteer instances (minimum two, with distinct personas) keep the auction competitive.
2. **Bid price had no payout meaning.** The original spec paid bounty plus stake to the winner regardless of winning bid price, which made the reverse auction theatrical. Fixed: winner receives `winningPrice + stake`. Resident relayer receives `bounty - winningPrice` as a refund. The reverse auction is now economically real.
3. **"Sealed bid" was not actually sealed.** Storing price and ETA directly on-chain meant anyone could read calldata and state immediately. Fixed: renamed to "time-boxed reverse auction" with public on-chain bids. The mechanic is honest: bids are visible the moment they land, and the time gate is what prevents late bidding.
4. **Reputation scoring was internally inconsistent and gameable.** The original spec required the contract to use a reputation score that bidders themselves passed in unverified, and that lived on a registry the contract did not read. Fixed: MonsoonMandiEscrow maintains its own `completedTasks` counter as the local reputation used in winner selection. Canonical ERC-8004 Reputation Registry writes are a separate display/audit step that runs after escrow payout. The on-chain winner-selection math depends only on the contract's own state.
5. **Scope was too wide for a six-hour build.** ERC-8004 registration, ERC-8004 reputation, x402 facilitator payments, Para social login, IPFS, Nugen vision, Foundry deploy, and live tx stream as a flat list meant any external dependency outage could sink the demo. Fixed: split into `MVP_Tier` and `Demo_Plus_Tier`, controlled by a single `DEMO_TIER` environment variable. The MVP demos a complete agent economy on Monad testnet without canonical ERC-8004 or x402 facilitator dependencies. Demo-Plus layers them on top, with each Demo-Plus feature wired so its failure does not break the MVP demo.

### Knock-on changes to this PRD

- **Module list (Implementation Decisions):** the Auction Engine now reads `completedTasks` from the contract's own state, not from a registry. The Mandi Escrow contract grows a `completedTasks` mapping plus the new payout/refund/slash math. Supply Agent and Route Agent each ship as a Next.js API route that toggles between in-process and x402-gated behaviour based on `DEMO_TIER`.
- **Risk register:** ERC-8004 SDK rough edges drop from Medium to Low because they only affect Demo-Plus. Monad testnet RPC instability stays High because both tiers depend on the chain. x402 facilitator outage is now bounded — Demo-Plus only.
- **Demo runbook:** step 5 is rewritten — now two Volunteer Agents bid against each other, each having paid Supply Agent and Route Agent for their respective quotes before bidding. Auction picks the lowest reputation-weighted bid.
- **Out of Scope additions:** ERC-8004 Validation Registry remains out of scope; canonical x402 USDC payments are now in Demo-Plus only with a fallback to MON-denominated headers if facilitator integration is flaky.

### Pointer

For acceptance criteria, see `.kiro/specs/monsoon-mandi/requirements.md`. That file is the source of truth for behavioural requirements; this PRD remains the source of truth for problem framing, user stories, and the strategic case for the project.

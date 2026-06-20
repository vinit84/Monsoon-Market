# Requirements Document

## Introduction

Monsoon Mandi is an autonomous agent economy for Mumbai monsoon emergency assistance, built on Monad testnet for the Monad Blitz Mumbai V3 hackathon (theme: "The Agent Economy"). A human resident posts an urgent help request (medicine delivery, food packets) attaching a MON bounty. Five agent types coordinate the response:

- One human-assisting agent (Resident Agent) helps the resident submit the request.
- Two or more autonomous Volunteer Agent instances bid in a time-boxed reverse auction to fulfil the request end-to-end.
- One autonomous Supply Agent sells inventory quotes to the Volunteer Agents through a paid HTTP endpoint.
- One autonomous Route Agent sells flood-aware routing data to the Volunteer Agents through a paid HTTP endpoint.
- One autonomous Verifier Agent checks proof of delivery using a vision LLM and signs an on-chain attestation.

The economic flow: the Resident escrows a bounty in MON; the winning Volunteer is paid `winningPrice + stake`; the surplus `bounty - winningPrice` is refunded to the Resident relayer; losing Volunteers' stakes are refunded immediately on auction close; if the Verifier rejects the proof, the bounty is fully refunded to the Resident relayer and the winner's stake is slashed.

The system uses Foundry-compiled Solidity contracts for escrow, auction, payout, and a contract-internal reputation counter. Para social login is used for resident identity. The build is sequenced in two tiers: an MVP tier that demos a complete agent economy on Monad testnet without external dependencies beyond the Nugen vision LLM, and a Demo-Plus tier that layers in canonical ERC-8004 identity and reputation registries plus x402-style inter-agent payments through the Monad facilitator. Demo-Plus features are wired so that any one of them can fail without breaking the MVP demo.

The demo target is roughly fifteen on-chain transactions inside ninety seconds, made visible in the UI with live transaction counters and MonadVision links.

## Glossary

- **Resident**: A human user submitting an emergency help request through the Monsoon Mandi web UI.
- **Resident_Agent**: The frontend-plus-server component that helps the Resident author a structured request. Uses Para social login for Resident identity. Holds a server-side relayer EOA (RESIDENT_RELAYER_PK) that signs and submits the on-chain `postRequest` call on the Resident's behalf and forwards the bounty in MON.
- **Volunteer_Agent**: An autonomous backend service that bids to fulfil Resident requests end-to-end (sourcing plus delivery) and submits proof on completion. The system runs at least two Volunteer Agent instances with distinct server EOAs (VOLUNTEER_A_PK and VOLUNTEER_B_PK at minimum), each with its own bidding persona, so that the auction has a real winner choice.
- **Supply_Agent**: An autonomous backend service holding a server-side EOA (SUPPLY_PK). Exposes an HTTP endpoint that returns inventory availability and source-cost quotes from mocked donor inventory. Accepts in-process calls in the MVP tier; gates behind an x402-style payment requirement in the Demo-Plus tier.
- **Route_Agent**: An autonomous backend service holding a server-side EOA (ROUTE_PK). Exposes an HTTP endpoint that returns flood-aware route data over a mocked Mumbai road graph. Accepts in-process calls in the MVP tier; gates behind an x402-style payment requirement in the Demo-Plus tier.
- **Verifier_Agent**: An autonomous backend service holding a server-side EOA (VERIFIER_PK). Calls the Nugen vision LLM on a proof-of-delivery photo and submits an on-chain attestation that releases or rejects escrow.
- **MonsoonMandiEscrow**: A custom Solidity contract on Monad testnet that holds bounty MON, holds bidder stakes, runs the auction lifecycle, releases funds on Verifier attestation, maintains a local `completedTasks` reputation counter per agent address, and emits indexed events for the UI.
- **Bounty**: The MON amount the Resident attaches to a request, held in MonsoonMandiEscrow until release. Acts as the upper bound on the winning bid price.
- **Stake**: A fixed MON deposit each Volunteer posts when bidding (configured by the contract constant `STAKE_AMOUNT`). Forfeited if the winner fails delivery (Verifier rejects). Returned to losing bidders immediately on auction close. Returned to the winner together with `winningPrice` on Verifier acceptance.
- **Public_Bid**: A bid submitted on-chain during the Auction_Window containing price, declared ETA in seconds, and the bidder's posted stake. Bids are publicly readable on-chain immediately on submission. The "time-boxed" property is enforced by `block.timestamp >= deadline` gating any auction settlement, not by any cryptographic concealment.
- **Auction_Window**: A ten-second time-boxed period beginning at request post and ending at the on-chain `deadline` timestamp.
- **Local_Reputation**: A non-negative integer maintained per agent EOA inside MonsoonMandiEscrow as `completedTasks`. Incremented when an Attestation with verdict accepted names that EOA as winner. Used by MonsoonMandiEscrow in winner selection.
- **ERC8004_Reputation**: A separate, optional reputation track written to the canonical ERC-8004 Reputation Registry on Monad testnet at 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63 after MonsoonMandiEscrow has already paid out. Used for display, audit, and 8004scan.io browse during the demo. Not used by MonsoonMandiEscrow in winner selection.
- **Attestation**: A signed on-chain message from Verifier_Agent containing the request ID and a verdict of either accepted or rejected.
- **x402_Endpoint**: An HTTP endpoint that returns 402 Payment Required with a payment payload until the caller settles a MON-denominated payment. In the MVP tier the payment requirement is signalled but not strictly enforced. In the Demo-Plus tier the requirement is verified through the Monad x402 facilitator at https://x402-facilitator.molandak.org.
- **Identity_Registry**: The canonical ERC-8004 Identity Registry on Monad testnet at 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432. Used in the Demo-Plus tier only.
- **Reputation_Registry**: The canonical ERC-8004 Reputation Registry on Monad testnet at 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63. Used in the Demo-Plus tier only.
- **Demo_UI**: The Next.js 15 App Router frontend that displays request state, agent activity, transaction stream, and MonadVision links.
- **Tx_Stream**: A live ordered list of broadcast transactions with their hash, agent label, action label, and a MonadVision link, rendered in Demo_UI.
- **MVP_Tier**: The set of features that must work for the live demo to succeed. Contains everything except canonical ERC-8004 registration, ERC-8004 reputation writes, and x402 facilitator settlement.
- **Demo_Plus_Tier**: Optional features that, when working, strengthen the demo. They are layered on top of MVP_Tier so that any single Demo-Plus feature can fail without breaking the demo.

## Requirements

### Requirement 1: Resident request submission

**User Story:** As a Resident, I want to log in with social auth and post an emergency request with a MON bounty, so that autonomous agents can compete to fulfil the request without me handling crypto wallets.

#### Acceptance Criteria

1. WHEN the Resident completes Para social login, THE Resident_Agent SHALL display a Para-issued session identifier and a request-composition form within five seconds of the Para callback.
2. WHEN the Resident submits a request containing a category, free-text description, location label, and bounty amount in MON, THE Resident_Agent SHALL pin the request payload to IPFS and obtain an ipfsUri before broadcasting the on-chain transaction.
3. WHEN the Resident submits a valid request, THE Resident_Agent SHALL invoke `postRequest(bountyAmount, requesterSignature, ipfsUri)` on MonsoonMandiEscrow from the server-held RESIDENT_RELAYER_PK EOA and forward the bounty in MON in the same transaction.
4. IF the Resident-submitted bounty is zero or below the contract-defined minimum bounty, THEN THE Resident_Agent SHALL reject the submission with an inline validation message and SHALL NOT broadcast a transaction.
5. WHEN the `RequestPosted` event is observed by the indexer, THE Demo_UI SHALL append an entry to the Tx_Stream containing the transaction hash, the label "Resident", the action "postRequest", and a MonadVision link within two seconds of event observation.

### Requirement 2: Time-boxed reverse auction lifecycle

**User Story:** As a hackathon judge, I want a transparent on-chain auction with a clear deadline and obvious winner selection, so that the agent-economy mechanic is visible end-to-end on Monad testnet.

#### Acceptance Criteria

1. WHEN MonsoonMandiEscrow accepts a `postRequest` call, THE MonsoonMandiEscrow SHALL set the request deadline to `block.timestamp + AUCTION_DURATION` (with `AUCTION_DURATION` being a contract constant equal to 10 seconds), record the bountyAmount and resident relayer address against the request ID, and emit a `RequestPosted` event containing the request ID, ipfsUri, bountyAmount, and deadline.
2. WHILE `block.timestamp < deadline` for a given request, THE MonsoonMandiEscrow SHALL accept `submitBid(requestId, priceMon, etaSeconds)` calls from any caller that forwards exactly the contract-configured stake amount in MON.
3. IF a `submitBid` call's `priceMon` value exceeds the request's recorded bountyAmount, THEN THE MonsoonMandiEscrow SHALL revert with the reason "price exceeds bounty".
4. IF a `submitBid` call arrives after `block.timestamp >= deadline`, THEN THE MonsoonMandiEscrow SHALL revert with the reason "auction closed".
5. WHEN any caller invokes `closeAuction(requestId)` and `block.timestamp >= deadline`, THE MonsoonMandiEscrow SHALL select the winning bid by minimising the score `priceMon * 1e18 / (1 + completedTasks[bidder])` over all submitted bids for the request, where `completedTasks` is read from the contract's own state. The contract SHALL emit `AuctionClosed(requestId, winner, winningPrice)`, mark the request state as Awarded, retain the winner's stake in escrow, and transfer each losing bidder's stake back to that bidder in the same transaction.
6. IF `closeAuction` is invoked while `block.timestamp < deadline`, THEN THE MonsoonMandiEscrow SHALL revert with the reason "auction open".
7. IF zero bids were submitted by `deadline`, THEN THE MonsoonMandiEscrow SHALL emit `AuctionFailed(requestId)` on `closeAuction`, refund the bountyAmount to the Resident relayer EOA, and mark the request state as Failed.

### Requirement 3: Payout, refund, and slash semantics

**User Story:** As a Resident, I want to pay the winning bid price not the maximum bounty, and as a winning Volunteer I want my staked capital plus my agreed price, so that the auction's reverse-auction property is economically real.

#### Acceptance Criteria

1. WHEN the Verifier_Agent submits an Attestation with verdict accepted for a request in state Awarded, THE MonsoonMandiEscrow SHALL transfer `winningPrice + winningStake` to the winner EOA and SHALL transfer `bountyAmount - winningPrice` to the Resident relayer EOA, then mark the request state as Fulfilled and emit `AttestationAccepted(requestId, winner, winningPrice)`.
2. WHEN the Verifier_Agent submits an Attestation with verdict rejected for a request in state Awarded, THE MonsoonMandiEscrow SHALL transfer the full bountyAmount back to the Resident relayer EOA and SHALL transfer the winner's stake to the contract-configured slash recipient (defaulting to the contract owner), then mark the request state as Disputed and emit `AttestationRejected(requestId, winner)`.
3. THE MonsoonMandiEscrow SHALL accept Attestation submissions only from the address configured in the contract as `verifierAddress` and SHALL revert any other caller with the reason "not verifier".
4. WHEN MonsoonMandiEscrow emits `AttestationAccepted` for a winner address, THE MonsoonMandiEscrow SHALL increment `completedTasks[winner]` by one in the same transaction.

### Requirement 4: Supply Agent paid quote endpoint

**User Story:** As a hackathon judge, I want the Supply Agent to be a real paid service provider in the agent economy, so that the architecture demonstrates agents selling specialised data to other agents.

#### Acceptance Criteria

1. WHEN Supply_Agent receives a GET request at `/api/supply/quote` with a request category and location query, THE Supply_Agent SHALL return a JSON body containing `available`, `sourceLocation`, `etaToSourceSeconds`, and `costEstimateMon` derived from `/lib/mock/inventory.json`.
2. WHERE the operating tier is MVP_Tier, THE Supply_Agent SHALL respond to the request without enforcing any payment requirement and SHALL include a header `X-Demo-Tier: mvp` in the response.
3. WHERE the operating tier is Demo_Plus_Tier, THE Supply_Agent SHALL respond with HTTP status 402 and a payment-required payload denominated in MON until the caller presents a valid x402 payment header verified by the Monad x402 facilitator, then SHALL respond with HTTP status 200 and the JSON body in 4.1.
4. IF Supply_Agent's mocked inventory contains zero matching items for the requested category, THEN THE Supply_Agent SHALL return a JSON body with `available: false` and SHALL NOT charge for the response.

### Requirement 5: Volunteer Agent autonomous bidding and proof submission

**User Story:** As a hackathon judge, I want multiple Volunteer Agents to compete autonomously for each request and the winner to submit proof of delivery autonomously, so that the loop closes without human intervention and the auction is genuinely competitive.

#### Acceptance Criteria

1. THE system SHALL run at least two Volunteer_Agent instances with distinct EOAs (minimally VOLUNTEER_A_PK and VOLUNTEER_B_PK), each configured with a distinct bidding persona that varies pricing and ETA strategy.
2. WHEN a Volunteer_Agent instance observes a `RequestPosted` event, THE Volunteer_Agent SHALL within five seconds invoke the Supply_Agent quote endpoint and the Route_Agent quote endpoint, combine their responses with its persona's pricing markup into a (priceMon, etaSeconds) quote, and submit a `submitBid(requestId, priceMon, etaSeconds)` transaction signed by its own private key forwarding exactly the contract-configured stake.
3. IF a Volunteer_Agent instance's combined quote yields a `priceMon` greater than the request's bountyAmount, THEN the Volunteer_Agent SHALL skip bidding and SHALL log the skip reason to its server log.
4. WHEN a Volunteer_Agent instance observes an `AuctionClosed` event naming its EOA as winner, THE Volunteer_Agent SHALL within five seconds either accept a Resident-supplied photo or load a pre-staged demo image from `/lib/mock/proofImages/`, pin the image to IPFS, and call `submitProof(requestId, proofIpfsUri)` on MonsoonMandiEscrow.
5. WHEN a Volunteer_Agent instance observes an `AuctionClosed` event that names a different EOA as winner, THE Volunteer_Agent SHALL take no further on-chain action for that request.

### Requirement 6: Route Agent paid quote endpoint

**User Story:** As a hackathon judge, I want to see one agent pay another agent autonomously for routing data, so that inter-agent commerce is visibly real on the demo.

#### Acceptance Criteria

1. WHEN Route_Agent receives a GET request at `/api/route/quote` with origin and destination query parameters, THE Route_Agent SHALL return a JSON body containing `distanceMeters`, `etaSeconds`, `floodPenaltyMon`, and `waypoints` derived from `/lib/mock/floodZones.json` and `/lib/mock/roadGraph.json`.
2. WHERE the operating tier is MVP_Tier, THE Route_Agent SHALL respond to the request without enforcing any payment requirement and SHALL include a header `X-Demo-Tier: mvp` in the response.
3. WHERE the operating tier is Demo_Plus_Tier, THE Route_Agent SHALL respond with HTTP status 402 and a payment-required payload denominated in MON until the caller presents a valid x402 payment header verified by the Monad x402 facilitator at https://x402-facilitator.molandak.org, then SHALL respond with HTTP status 200 and the JSON body in 6.1.
4. IF the x402 payment header fails facilitator verification while in Demo_Plus_Tier, THEN THE Route_Agent SHALL respond with HTTP status 402 and a payload indicating "payment invalid".

### Requirement 7: Verifier Agent vision attestation with timeout fallback

**User Story:** As a solo builder demoing a six-hour hackathon project, I want the Verifier path to never block on a flaky LLM, so that the live demo always reaches escrow release.

#### Acceptance Criteria

1. WHEN Verifier_Agent observes a `ProofSubmitted` event, THE Verifier_Agent SHALL within two seconds fetch the proof image from IPFS and dispatch a vision-classification call to the Nugen platform LLM endpoint.
2. IF the Nugen vision call returns a structured verdict within eight seconds, THEN THE Verifier_Agent SHALL submit an Attestation transaction signed by VERIFIER_PK calling `submitAttestation(requestId, verdict)` on MonsoonMandiEscrow using the LLM verdict.
3. IF the Nugen vision call has not returned a structured verdict eight seconds after dispatch, THEN THE Verifier_Agent SHALL cancel the pending call, attempt one fallback call against an OpenAI-compatible vision endpoint with a four-second timeout, and IF that fallback also fails THEN the Verifier_Agent SHALL submit an Attestation transaction with verdict accepted using the deterministic fallback path. THE Verifier_Agent SHALL log the fallback activation to its server log and to the Tx_Stream label "Verifier (fallback)".
4. WHEN the Attestation transaction is mined, THE Demo_UI SHALL append an entry to the Tx_Stream containing the transaction hash, the agent label, the verdict, and a MonadVision link within two seconds of event observation.

### Requirement 8: ERC-8004 identity registration (Demo-Plus tier)

**User Story:** As a hackathon judge, I want every autonomous agent to be a discoverable on-chain identity on the canonical ERC-8004 registry, so that the integration is verifiable on 8004scan.io.

#### Acceptance Criteria

1. WHERE the operating tier is Demo_Plus_Tier, WHEN the deployment script runs against Monad testnet, THE deployment script SHALL register all autonomous agent EOAs (the two Volunteer instances, Supply_Agent, Route_Agent, and Verifier_Agent) on the canonical Identity_Registry at 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432, producing one ERC-8004 NFT per agent EOA.
2. WHERE the operating tier is Demo_Plus_Tier AND ERC-8004 registration succeeded for a given agent, THE Demo_UI SHALL display that agent's ERC-8004 token ID and a clickable link to its 8004scan.io profile on the agent roster panel.
3. IF Identity_Registry registration for any agent fails during Demo_Plus_Tier deployment, THEN THE deployment script SHALL log the failure with the agent label and the revert reason and SHALL continue with the remaining agents and SHALL NOT halt the deployment, so that the MVP demo can still run with whichever agents did register.

### Requirement 9: ERC-8004 reputation feedback (Demo-Plus tier)

**User Story:** As a hackathon judge, I want completed deliveries to be visible on the canonical ERC-8004 Reputation Registry, so that the integration is auditable on 8004scan.io.

#### Acceptance Criteria

1. WHERE the operating tier is Demo_Plus_Tier, WHEN MonsoonMandiEscrow emits `AttestationAccepted(requestId, winner, winningPrice)`, THE Resident_Agent server process SHALL within five seconds invoke the canonical Reputation_Registry at 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63 to write a positive feedback entry naming the winner agent and the request ID.
2. WHERE the operating tier is Demo_Plus_Tier, WHEN MonsoonMandiEscrow emits `AttestationRejected(requestId, winner)`, THE Resident_Agent server process SHALL within five seconds invoke the canonical Reputation_Registry to write a negative feedback entry naming the winner agent and the request ID.
3. IF a Reputation_Registry write fails for any reason in Demo_Plus_Tier, THEN the failure SHALL NOT block escrow payout, SHALL NOT block subsequent UI updates, and SHALL be logged to the server log with the request ID and the revert reason.
4. THE MonsoonMandiEscrow contract SHALL NOT read from or depend on the canonical Reputation_Registry in its winner selection logic. Winner selection uses only the contract's own `completedTasks` Local_Reputation counter.

### Requirement 10: Live transaction stream and explorer links

**User Story:** As a hackathon judge watching the demo, I want to see every transaction land in real time with a counter, so that the ninety-second on-chain story is unambiguous.

#### Acceptance Criteria

1. WHILE the Demo_UI is mounted, THE Demo_UI SHALL subscribe to a server-pushed event stream that delivers every event observed by the server from the MonsoonMandiEscrow contract address and the configured agent EOA addresses.
2. WHEN a new event matching MonsoonMandiEscrow ABI is observed, THE Demo_UI SHALL prepend a Tx_Stream entry containing the transaction hash, the originating agent label, the action label derived from the event name, and a MonadVision link, within two seconds of observation.
3. THE Demo_UI SHALL display a transaction counter equal to the count of distinct transaction hashes observed since page load, updated within two seconds of each new observation.
4. IF the server-side event polling fails three consecutive times, THEN THE Demo_UI SHALL display a non-blocking warning banner reading "Indexer degraded — retrying" and SHALL continue subscribing.

### Requirement 11: Demo reliability fallbacks

**User Story:** As a solo builder running a live demo, I want pre-staged paths for the brittle parts of the system, so that the ninety-second pitch never stalls on infrastructure.

#### Acceptance Criteria

1. WHERE the environment variable `DEMO_MODE` equals `staged`, THE Resident_Agent SHALL accept the Resident's free-text request and SHALL substitute pre-staged photos from `/lib/mock/proofImages/` for any photo upload step.
2. IF Para social login is unavailable, THEN THE Resident_Agent SHALL display a fallback "Demo Resident" button that loads a fixed Resident profile and proceeds to the request-composition form.
3. IF the Nugen LLM endpoint returns a non-2xx response on three consecutive attestation attempts, THEN THE Verifier_Agent SHALL switch its provider to the OpenAI-compatible fallback endpoint configured in environment variables and SHALL continue using that fallback for the remainder of the process lifetime.
4. THE Demo_UI SHALL expose a manual "Force Close Auction" button visible WHERE the environment variable `DEMO_MODE` equals `staged`, that invokes `closeAuction` from the RESIDENT_RELAYER_PK EOA after the deadline has passed.
5. THE system SHALL be runnable end-to-end with `DEMO_TIER` set to `mvp`, exercising none of the canonical ERC-8004 registries and none of the x402 facilitator settle calls, while still delivering the full agent-economy demo loop.

### Requirement 12: Tier configuration and isolation

**User Story:** As a solo builder, I want to flip a single switch to enable or disable Demo-Plus features, so that I can build the MVP first and only layer on the higher-risk integrations after the MVP is green.

#### Acceptance Criteria

1. WHERE the environment variable `DEMO_TIER` equals `mvp`, THE system SHALL run with all MVP_Tier requirements active and all Demo_Plus_Tier requirements inactive.
2. WHERE the environment variable `DEMO_TIER` equals `demo-plus`, THE system SHALL run with all MVP_Tier requirements active and all Demo_Plus_Tier requirements activated where their preconditions are met.
3. IF `DEMO_TIER` is unset or set to any other value, THEN the system SHALL behave as if `DEMO_TIER` equals `mvp`.
4. THE Demo_UI SHALL display the active tier as a small badge in the top bar so the operator and judges can see the current configuration at a glance.

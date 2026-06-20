// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title  MonsoonMandiEscrow
/// @notice Time-boxed reverse-auction escrow for the Monsoon Mandi agent economy.
///         A Resident Relayer EOA posts a request and locks a MON bounty.
///         Volunteer agents submit public on-chain bids inside a 10-second auction window.
///         At close, the lowest reputation-weighted bid wins, losing stakes are refunded
///         immediately, the winner submits proof, and a configured Verifier EOA attests.
///         On accept: winner receives `winningPrice + stake`, resident receives
///         `bountyAmount - winningPrice` as refund, winner's `completedTasks` increments.
///         On reject: resident receives full bounty, winner stake goes to slash recipient.
contract MonsoonMandiEscrow {
    // ---------------------------------------------------------------- Types

    enum State {
        None,
        Open,
        Awarded,
        Fulfilled,
        Disputed,
        Failed
    }

    struct Bid {
        address bidder;
        uint128 priceMon;
        uint64 etaSeconds;
        uint128 stake;
    }

    struct Request {
        address resident;
        uint128 bountyAmount;
        uint64 deadline;
        State state;
        address winner;
        uint128 winningPrice;
        uint128 winningStake;
        string ipfsUri;
        string proofIpfsUri;
    }

    // -------------------------------------------------------------- Storage

    address public immutable owner;
    address public immutable verifier;
    address public slashRecipient;

    uint256 public constant AUCTION_DURATION = 10;
    uint256 public constant STAKE_AMOUNT = 0.01 ether;
    uint256 public constant MIN_BOUNTY = 0.01 ether;

    uint256 public nextRequestId;
    mapping(uint256 => Request) private _requests;
    mapping(uint256 => Bid[]) private _bids;

    /// @notice Local reputation counter used by `closeAuction` for winner selection.
    ///         The canonical ERC-8004 Reputation Registry is written off-chain after
    ///         payout for display/audit only and is intentionally not consulted here.
    mapping(address => uint256) public completedTasks;

    uint256 private _locked = 1;

    // --------------------------------------------------------------- Events

    event RequestPosted(
        uint256 indexed requestId,
        address indexed resident,
        uint128 bountyAmount,
        uint64 deadline,
        string ipfsUri
    );
    event BidSubmitted(
        uint256 indexed requestId,
        address indexed bidder,
        uint128 priceMon,
        uint64 etaSeconds,
        uint128 stake
    );
    event AuctionClosed(uint256 indexed requestId, address indexed winner, uint128 winningPrice);
    event AuctionFailed(uint256 indexed requestId);
    event ProofSubmitted(uint256 indexed requestId, address indexed winner, string proofIpfsUri);
    event AttestationAccepted(uint256 indexed requestId, address indexed winner, uint128 winningPrice);
    event AttestationRejected(uint256 indexed requestId, address indexed winner);
    event SlashRecipientUpdated(address indexed previous, address indexed next);

    // --------------------------------------------------------------- Errors

    error InvalidState();
    error AuctionStillOpen();
    error AuctionAlreadyClosed();
    error PriceExceedsBounty();
    error WrongStake();
    error InsufficientBounty();
    error EmptyIpfsUri();
    error NotVerifier();
    error NotWinner();
    error NotOwner();
    error TransferFailed();
    error Reentrant();
    error ZeroAddress();

    // ------------------------------------------------------------- Modifiers

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrant();
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ----------------------------------------------------------- Constructor

    constructor(address _verifier, address _slashRecipient) {
        if (_verifier == address(0) || _slashRecipient == address(0)) revert ZeroAddress();
        owner = msg.sender;
        verifier = _verifier;
        slashRecipient = _slashRecipient;
    }

    // ------------------------------------------------------------- Mutators

    /// @notice Resident relayer posts a new emergency request and locks the bounty.
    /// @param ipfsUri IPFS URI of the request payload (description, location, etc.).
    function postRequest(string calldata ipfsUri) external payable returns (uint256 requestId) {
        if (msg.value < MIN_BOUNTY) revert InsufficientBounty();
        if (bytes(ipfsUri).length == 0) revert EmptyIpfsUri();

        unchecked {
            requestId = ++nextRequestId;
        }
        uint64 deadline = uint64(block.timestamp + AUCTION_DURATION);

        Request storage r = _requests[requestId];
        r.resident = msg.sender;
        r.bountyAmount = uint128(msg.value);
        r.deadline = deadline;
        r.state = State.Open;
        r.ipfsUri = ipfsUri;

        emit RequestPosted(requestId, msg.sender, uint128(msg.value), deadline, ipfsUri);
    }

    /// @notice Volunteer agent submits a public bid. Bid is visible on-chain immediately.
    /// @dev    The auction is time-boxed, not cryptographically sealed.
    function submitBid(uint256 requestId, uint128 priceMon, uint64 etaSeconds) external payable {
        Request storage r = _requests[requestId];
        if (r.state != State.Open) revert InvalidState();
        if (block.timestamp >= r.deadline) revert AuctionAlreadyClosed();
        if (msg.value != STAKE_AMOUNT) revert WrongStake();
        if (priceMon > r.bountyAmount) revert PriceExceedsBounty();

        _bids[requestId].push(
            Bid({bidder: msg.sender, priceMon: priceMon, etaSeconds: etaSeconds, stake: uint128(msg.value)})
        );

        emit BidSubmitted(requestId, msg.sender, priceMon, etaSeconds, uint128(msg.value));
    }

    /// @notice Close the auction once the deadline has passed.
    ///         Picks the winner by minimising `priceMon * 1e18 / (1 + completedTasks[bidder])`.
    ///         Refunds every losing bidder their stake in the same transaction.
    ///         If no bids were submitted, refunds the bounty to the resident relayer.
    function closeAuction(uint256 requestId) external nonReentrant {
        Request storage r = _requests[requestId];
        if (r.state != State.Open) revert InvalidState();
        if (block.timestamp < r.deadline) revert AuctionStillOpen();

        Bid[] storage requestBids = _bids[requestId];
        uint256 n = requestBids.length;

        if (n == 0) {
            r.state = State.Failed;
            uint128 bounty = r.bountyAmount;
            r.bountyAmount = 0;
            _send(r.resident, bounty);
            emit AuctionFailed(requestId);
            return;
        }

        uint256 bestIdx = 0;
        uint256 bestScore = type(uint256).max;
        for (uint256 i = 0; i < n; ++i) {
            Bid storage b = requestBids[i];
            uint256 score = (uint256(b.priceMon) * 1e18) / (1 + completedTasks[b.bidder]);
            if (score < bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }

        Bid memory winning = requestBids[bestIdx];
        r.state = State.Awarded;
        r.winner = winning.bidder;
        r.winningPrice = winning.priceMon;
        r.winningStake = winning.stake;

        // Refund losing stakes (effects already written; safe under nonReentrant).
        for (uint256 i = 0; i < n; ++i) {
            if (i == bestIdx) continue;
            Bid memory losing = requestBids[i];
            _send(losing.bidder, losing.stake);
        }

        emit AuctionClosed(requestId, winning.bidder, winning.priceMon);
    }

    /// @notice Winning Volunteer submits proof of delivery (IPFS URI of the photo).
    function submitProof(uint256 requestId, string calldata proofIpfsUri) external {
        Request storage r = _requests[requestId];
        if (r.state != State.Awarded) revert InvalidState();
        if (msg.sender != r.winner) revert NotWinner();
        if (bytes(proofIpfsUri).length == 0) revert EmptyIpfsUri();

        r.proofIpfsUri = proofIpfsUri;
        emit ProofSubmitted(requestId, r.winner, proofIpfsUri);
    }

    /// @notice Verifier attests to whether the proof is acceptable, releasing or slashing escrow.
    function submitAttestation(uint256 requestId, bool accepted) external nonReentrant {
        if (msg.sender != verifier) revert NotVerifier();
        Request storage r = _requests[requestId];
        if (r.state != State.Awarded) revert InvalidState();

        if (accepted) {
            r.state = State.Fulfilled;
            uint128 toWinner = r.winningPrice + r.winningStake;
            uint128 toResident = r.bountyAmount - r.winningPrice;
            address winnerAddr = r.winner;
            address residentAddr = r.resident;
            uint128 winningPriceLog = r.winningPrice;
            r.bountyAmount = 0;
            r.winningStake = 0;

            _send(winnerAddr, toWinner);
            if (toResident > 0) _send(residentAddr, toResident);

            unchecked {
                completedTasks[winnerAddr] += 1;
            }
            emit AttestationAccepted(requestId, winnerAddr, winningPriceLog);
        } else {
            r.state = State.Disputed;
            uint128 toResident = r.bountyAmount;
            uint128 toSlash = r.winningStake;
            address winnerAddr = r.winner;
            address residentAddr = r.resident;
            r.bountyAmount = 0;
            r.winningStake = 0;

            _send(residentAddr, toResident);
            _send(slashRecipient, toSlash);

            emit AttestationRejected(requestId, winnerAddr);
        }
    }

    // -------------------------------------------------------------- Admin

    function setSlashRecipient(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        emit SlashRecipientUpdated(slashRecipient, next);
        slashRecipient = next;
    }

    // ---------------------------------------------------------------- Views

    function getRequest(uint256 requestId) external view returns (Request memory) {
        return _requests[requestId];
    }

    function getBids(uint256 requestId) external view returns (Bid[] memory) {
        return _bids[requestId];
    }

    function getBidCount(uint256 requestId) external view returns (uint256) {
        return _bids[requestId].length;
    }

    // ----------------------------------------------------------- Internals

    function _send(address to, uint256 amount) private {
        if (amount == 0) return;
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}

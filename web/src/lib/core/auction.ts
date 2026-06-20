/**
 * Auction Engine — pure function. Mirrors the on-chain scoring logic in
 * MonsoonMandiEscrow.closeAuction so the UI can preview the winner before the
 * close-auction transaction lands.
 *
 * On-chain formula:  score = priceMon * 1e18 / (1 + completedTasks[bidder])
 * Lower score wins. Earliest submission wins ties (bids are stored in order).
 */

export interface BidInput {
    bidder: `0x${string}`;
    priceMon: bigint;
    etaSeconds: bigint;
    /** Local reputation for the bidder, read from the escrow contract's `completedTasks`. */
    completedTasks: bigint;
}

export interface AuctionPreview {
    winner: BidInput | null;
    /** All bids ranked best-first. */
    ranked: ReadonlyArray<BidInput & { score: bigint }>;
}

export function previewAuction(bids: ReadonlyArray<BidInput>): AuctionPreview {
    if (bids.length === 0) return { winner: null, ranked: [] };
    const scored = bids.map((b) => ({
        ...b,
        score: (b.priceMon * 10n ** 18n) / (1n + b.completedTasks),
    }));
    // stable sort — earlier index breaks ties because Array.prototype.sort is stable
    const ranked = [...scored].sort((a, b) => (a.score < b.score ? -1 : a.score > b.score ? 1 : 0));
    return { winner: ranked[0], ranked };
}

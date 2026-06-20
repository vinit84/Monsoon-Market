/**
 * Compact ABI for client-side wagmi calls. Only the functions the volunteer
 * dashboard needs to invoke from MetaMask.
 */
export const escrowClientAbi = [
    {
        type: "function",
        name: "submitBid",
        stateMutability: "payable",
        inputs: [
            { name: "requestId", type: "uint256" },
            { name: "priceMon", type: "uint128" },
            { name: "etaSeconds", type: "uint64" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "submitProof",
        stateMutability: "nonpayable",
        inputs: [
            { name: "requestId", type: "uint256" },
            { name: "proofIpfsUri", type: "string" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "postRequest",
        stateMutability: "payable",
        inputs: [{ name: "ipfsUri", type: "string" }],
        outputs: [{ name: "requestId", type: "uint256" }],
    },
    {
        type: "function",
        name: "STAKE_AMOUNT",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "completedTasks",
        stateMutability: "view",
        inputs: [{ type: "address" }],
        outputs: [{ type: "uint256" }],
    },
] as const;

export const ESCROW_ADDRESS_PUBLIC =
    (process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}` | undefined) ??
    "0xcb01b2320b71e118a3bc5f3026f5fb3647c7bbc7";

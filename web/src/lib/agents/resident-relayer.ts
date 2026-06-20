import { walletFor } from "@/lib/onchain/wallets";
import { writeEscrow } from "@/lib/onchain/escrow-client";

export interface PostRequestArgs {
    bountyMon: number;
    ipfsUri: string;
}

/** Submit a postRequest tx using the RESIDENT_RELAYER_PK EOA. */
export async function residentPostRequest(args: PostRequestArgs): Promise<`0x${string}`> {
    const wallet = walletFor("resident-relayer");
    const escrow = writeEscrow(wallet);
    const value = BigInt(Math.floor(args.bountyMon * 1e18));
    return await escrow.write.postRequest([args.ipfsUri], {
        value,
        chain: wallet.chain,
        account: wallet.account!,
    });
}

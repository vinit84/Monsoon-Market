import inventory from "@/lib/mock/inventory.json";

interface Donor {
    donorId: string;
    name: string;
    locationName: string;
    items: { category: string; quantity: number; unitCostMon: number }[];
}

interface Inventory {
    donors: Donor[];
}

const inv = inventory as Inventory;

export interface InventoryQuote {
    available: boolean;
    donorId?: string;
    donorName?: string;
    sourceLocation?: string;
    quantity?: number;
    costEstimateMon?: number;
}

/** Find the cheapest donor that has the requested category. */
export function getInventoryQuote(category: string): InventoryQuote {
    let best: { donor: Donor; unitCostMon: number; quantity: number } | null = null;
    for (const d of inv.donors) {
        for (const item of d.items) {
            if (item.category.toLowerCase() === category.toLowerCase() && item.quantity > 0) {
                if (!best || item.unitCostMon < best.unitCostMon) {
                    best = { donor: d, unitCostMon: item.unitCostMon, quantity: item.quantity };
                }
            }
        }
    }
    if (!best) return { available: false };
    return {
        available: true,
        donorId: best.donor.donorId,
        donorName: best.donor.name,
        sourceLocation: best.donor.locationName,
        quantity: best.quantity,
        costEstimateMon: best.unitCostMon,
    };
}

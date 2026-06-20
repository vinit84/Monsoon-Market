import floodZones from "@/lib/mock/floodZones.json";
import roadGraph from "@/lib/mock/roadGraph.json";

/**
 * Route Service — pure function over the mocked Mumbai road graph and flood zones.
 *
 * Returns distance, ETA, and a flood penalty that approximates the extra cost
 * of routing around active flooding. Used by the Volunteer Agent to compute
 * its bid, and by the Route Agent's HTTP endpoint to serve paid quotes.
 */

interface RoadNode {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

interface RoadEdge {
    from: string;
    to: string;
    distanceMeters: number;
    baseEtaSeconds: number;
}

interface RoadGraph {
    nodes: RoadNode[];
    edges: RoadEdge[];
}

interface FloodZone {
    name: string;
    nodeIds: string[];
    /** 0..1 — fraction of normal traffic capacity. */
    severity: number;
}

interface FloodZones {
    zones: FloodZone[];
}

const FLOOD_PENALTY_MON_PER_SEVERITY = 0.005; // 0.005 MON per unit of severity per affected hop

const graph = roadGraph as RoadGraph;
const flood = floodZones as FloodZones;

/** Find the shortest path by summing baseEtaSeconds, with simple Dijkstra. */
function shortestPath(originId: string, destId: string): { path: string[]; etaSeconds: number; distanceMeters: number } | null {
    const adj = new Map<string, RoadEdge[]>();
    for (const e of graph.edges) {
        if (!adj.has(e.from)) adj.set(e.from, []);
        if (!adj.has(e.to)) adj.set(e.to, []);
        adj.get(e.from)!.push(e);
        adj.get(e.to)!.push({ from: e.to, to: e.from, distanceMeters: e.distanceMeters, baseEtaSeconds: e.baseEtaSeconds });
    }
    const dist = new Map<string, number>();
    const dm = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const queue: string[] = [];
    for (const n of graph.nodes) {
        dist.set(n.id, Infinity);
        dm.set(n.id, Infinity);
        prev.set(n.id, null);
        queue.push(n.id);
    }
    dist.set(originId, 0);
    dm.set(originId, 0);

    while (queue.length > 0) {
        // pop node with smallest dist
        queue.sort((a, b) => (dist.get(a)! - dist.get(b)!));
        const u = queue.shift()!;
        if (u === destId) break;
        if (dist.get(u) === Infinity) return null;
        for (const e of adj.get(u) ?? []) {
            if (!queue.includes(e.to)) continue;
            const alt = dist.get(u)! + e.baseEtaSeconds;
            if (alt < (dist.get(e.to) ?? Infinity)) {
                dist.set(e.to, alt);
                dm.set(e.to, (dm.get(u) ?? 0) + e.distanceMeters);
                prev.set(e.to, u);
            }
        }
    }
    if ((dist.get(destId) ?? Infinity) === Infinity) return null;

    const path: string[] = [];
    let cur: string | null = destId;
    while (cur) {
        path.unshift(cur);
        cur = prev.get(cur) ?? null;
    }
    return { path, etaSeconds: dist.get(destId)!, distanceMeters: dm.get(destId)! };
}

export interface RouteQuote {
    distanceMeters: number;
    etaSeconds: number;
    floodPenaltyMon: number;
    waypoints: { id: string; name: string; lat: number; lng: number }[];
}

export function getRouteQuote(originId: string, destinationId: string): RouteQuote | null {
    const path = shortestPath(originId, destinationId);
    if (!path) return null;

    let penalty = 0;
    for (const nodeId of path.path) {
        for (const z of flood.zones) {
            if (z.nodeIds.includes(nodeId)) penalty += z.severity * FLOOD_PENALTY_MON_PER_SEVERITY;
        }
    }

    const waypoints = path.path
        .map((id) => graph.nodes.find((n) => n.id === id))
        .filter((n): n is RoadNode => n !== undefined);

    return {
        distanceMeters: path.distanceMeters,
        etaSeconds: path.etaSeconds,
        floodPenaltyMon: Math.round(penalty * 1e6) / 1e6,
        waypoints,
    };
}

/** Lookup-by-name utility for convenience in the API layer. */
export function findNodeIdByName(name: string): string | null {
    const m = graph.nodes.find((n) => n.name.toLowerCase() === name.toLowerCase());
    return m?.id ?? null;
}

"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Mumbai flood hotspots — documented chronic flooding zones from BMC reports
 * and Indian news coverage (Hindustan Times, TOI, Mid-Day) during the
 * 2024 and 2025 monsoon seasons.
 *
 * Severity 0–1: 1.0 = always-flood, ankle-to-waist deep at peak rainfall
 *               0.5 = waterlogs in heavy rain, 30–60 min clearance
 *               0.2 = occasional minor waterlogging
 */

interface FloodSpot {
    name: string;
    lat: number;
    lng: number;
    severity: number;
    summary: string;
}

const FLOOD_SPOTS: FloodSpot[] = [
    { name: "Andheri Subway", lat: 19.1197, lng: 72.8470, severity: 0.95, summary: "Closed multiple times during 2024-2025 monsoon. Up to 2 ft waterlogging." },
    { name: "Hindmata Junction (Dadar)", lat: 19.0192, lng: 72.8424, severity: 0.95, summary: "Dadar TT chronic flood spot; underground tanks installed but still floods in heavy rain." },
    { name: "Milan Subway (Santacruz)", lat: 19.0850, lng: 72.8410, severity: 0.90, summary: "Recurring closure during monsoon. Western Express Highway diversion required." },
    { name: "King's Circle / Sion", lat: 19.0354, lng: 72.8625, severity: 0.85, summary: "Sion-Matunga belt floods within 1 hr of intense rain. Local trains halt." },
    { name: "Kurla Pipe Road", lat: 19.0726, lng: 72.8786, severity: 0.80, summary: "Connects Kurla West to LBS Marg. Knee-deep waterlogging recurring." },
    { name: "Gandhi Market (Sion)", lat: 19.0399, lng: 72.8607, severity: 0.85, summary: "Cited in BMC's 2024 annual flood vulnerability assessment as red zone." },
    { name: "Chembur RPF", lat: 19.0535, lng: 72.9020, severity: 0.65, summary: "Eastern Mumbai chronic spot. Affects RCF, Tata Colony residents." },
    { name: "Worli Naka", lat: 19.0153, lng: 72.8170, severity: 0.45, summary: "Improves with new pumping stations but still affected in cyclonic rain." },
    { name: "Marine Drive (S)", lat: 18.9437, lng: 72.8232, severity: 0.40, summary: "High tide + rain combination causes overflow at Marine Lines." },
    { name: "Bandra Reclamation", lat: 19.0400, lng: 72.8300, severity: 0.50, summary: "Gets cut off from rest of suburb when SV Road floods." },
    { name: "Andheri East (Marol)", lat: 19.1186, lng: 72.8825, severity: 0.70, summary: "MIDC area; affects IT companies and SEEPZ during monsoon peaks." },
    { name: "Kalbadevi / Crawford", lat: 18.9510, lng: 72.8328, severity: 0.55, summary: "South Mumbai flooding zone; old drainage system." },
];

const SAFE_ROUTES: [string, string][] = [
    ["Andheri East (Marol)", "Andheri Subway"],
    ["Andheri Subway", "Bandra Reclamation"],
    ["Bandra Reclamation", "Worli Naka"],
    ["Worli Naka", "Marine Drive (S)"],
    ["King's Circle / Sion", "Hindmata Junction (Dadar)"],
    ["Hindmata Junction (Dadar)", "Worli Naka"],
];

const find = (n: string) => FLOOD_SPOTS.find((s) => s.name === n)!;

function severityColor(s: number): string {
    if (s >= 0.7) return "#e74c3c";
    if (s >= 0.4) return "#f39c12";
    return "#2ecc71";
}

export function MumbaiMapInner() {
    return (
        <MapContainer
            center={[19.0760, 72.8777]}
            zoom={11}
            scrollWheelZoom={false}
            className="w-full h-full rounded-sm"
            style={{ background: "#0d1b2a" }}
        >
            {/* CartoDB Dark — matches our control-room aesthetic */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
            />

            {/* Inter-zone routes (volunteer paths) */}
            {SAFE_ROUTES.map(([a, b], i) => {
                const A = find(a), B = find(b);
                const sev = (A.severity + B.severity) / 2;
                return (
                    <Polyline
                        key={i}
                        positions={[[A.lat, A.lng], [B.lat, B.lng]]}
                        pathOptions={{
                            color: sev > 0.6 ? "#e74c3c" : "#2ecc71",
                            weight: 2,
                            opacity: 0.55,
                            dashArray: sev > 0.6 ? "6 6" : undefined,
                        }}
                    />
                );
            })}

            {/* Flood spots */}
            {FLOOD_SPOTS.map((s) => (
                <CircleMarker
                    key={s.name}
                    center={[s.lat, s.lng]}
                    radius={s.severity >= 0.8 ? 11 : s.severity >= 0.5 ? 8 : 6}
                    pathOptions={{
                        color: severityColor(s.severity),
                        fillColor: severityColor(s.severity),
                        fillOpacity: 0.5,
                        weight: 2,
                    }}
                >
                    <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                        <strong>{s.name}</strong>
                        <br />
                        Severity: {(s.severity * 100).toFixed(0)}%
                    </Tooltip>
                    <Popup>
                        <div style={{ minWidth: 220, fontFamily: "system-ui" }}>
                            <strong style={{ fontSize: 14, color: "#202223" }}>{s.name}</strong>
                            <div style={{ marginTop: 4, marginBottom: 6 }}>
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "2px 8px",
                                        borderRadius: 9999,
                                        background: severityColor(s.severity),
                                        color: "#fff",
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                >
                                    {(s.severity * 100).toFixed(0)}% severity
                                </span>
                            </div>
                            <p style={{ fontSize: 12, color: "#444", margin: 0, lineHeight: 1.5 }}>{s.summary}</p>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}

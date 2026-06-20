import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
    title: "Monsoon Mandi · Agent Economy on Monad",
    description:
        "Autonomous agent marketplace for Mumbai monsoon emergency relief. Built on Monad testnet for the Blitz V3 'Agent Economy' hackathon.",
    generator: "monskills",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full antialiased">
            <body className="min-h-full">
                <Providers>
                    <div className="flex min-h-screen">
                        <Sidebar />
                        <div className="flex-1 flex flex-col">
                            <Topbar />
                            <main className="flex-1 p-6">{children}</main>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}

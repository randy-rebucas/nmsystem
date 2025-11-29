import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/Layout";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    return {
      title: `${settings.siteName} - Multi-Level Marketing Platform`,
      description: "Commission-based digital commerce platform",
    };
  } catch {
    return {
      title: "NMSystem - Multi-Level Marketing Platform",
      description: "Commission-based digital commerce platform",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

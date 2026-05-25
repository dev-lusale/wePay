import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WePay — Salary-Backed Lending for Zambia",
  description:
    "WePay brings your salary closer to your needs. Access affordable salary-backed loans, track repayments, and manage your finances — all in one place.",
  keywords: ["WePay", "loans", "Zambia", "salary", "fintech", "lending"],
  authors: [{ name: "WePay" }],
  openGraph: {
    title: "WePay — Salary-Backed Lending for Zambia",
    description: "Drawing your needs closer to your Salary.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

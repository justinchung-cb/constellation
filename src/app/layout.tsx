import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Constellation — Visual Blockchain Explorer",
  description:
    "Explore the blockchain as a living 3D galaxy. Wallets are stars, transactions are beams of light.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full bg-black text-white font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

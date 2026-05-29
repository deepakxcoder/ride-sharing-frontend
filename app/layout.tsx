import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uber Web",
  description: "Request a ride from your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-black min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
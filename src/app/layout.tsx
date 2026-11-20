import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopLoader } from "@/components/ui/top-loader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "POS Minimercado",
  description: "Punto de venta y gestión de stock ágil",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TopLoader />
        {children}
      </body>
    </html>
  );
}

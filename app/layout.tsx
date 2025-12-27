import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Invoxa",
  description: "Repair Shop Invoice Software",
  icons: {
    icon: [
      { url: "/branding/Invoxa Logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/branding/Invoxa Logo.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}


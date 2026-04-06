import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IS ExpoLead",
  description: "Sistema de captura de leads para feiras e eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0f172a] text-white">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#fff",
              border: "1px solid #334155",
              fontSize: "16px",
            },
          }}
        />
      </body>
    </html>
  );
}

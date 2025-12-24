import "./globals.css";
import type { ReactNode } from "react";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata = {
  title: "Hotel Sakura",
  description: "Premium hospitality services",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

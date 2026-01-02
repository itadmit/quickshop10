import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickShop | פלטפורמה לחנויות אונליין",
  description: "בנה חנות אונליין מהירה ומעוצבת בקלות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

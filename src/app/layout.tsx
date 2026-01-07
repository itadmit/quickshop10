import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickShop | פלטפורמה לחנויות אונליין",
  description: "בנה חנות אונליין מהירה ומעוצבת בקלות",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

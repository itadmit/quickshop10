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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100..900&family=Pacifico&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

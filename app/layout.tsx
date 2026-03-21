import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "japan-canvas",
  description: "日本を旅行しながらキャンバスを描こう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

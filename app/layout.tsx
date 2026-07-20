import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ByteSize AI",
  description: "منصة تعلم ذكاء اصطناعي عربية أولا قائمة على البايتات والمشاريع"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-stimulus="standard">
      <body>{children}</body>
    </html>
  );
}


import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { withBasePath } from "@/lib/media";
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
    <html lang="ar" dir="rtl" data-stimulus="standard" style={{
      "--pixel-image": `url("${withBasePath("/content-media/L1-ENG-MATRIX-RAM/media/images/pixelated-triple-t.jpg")}")`
    } as CSSProperties}>
      <body>{children}</body>
    </html>
  );
}


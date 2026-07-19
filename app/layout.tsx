import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Assistant",
  description: "Chess Assistant Pro - AI-powered chess with Arabic explanations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css" />
      </head>
      <body>
        {children}
        <Script src="https://code.jquery.com/jquery-3.5.1.min.js" strategy="beforeInteractive" />
        <Script src="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

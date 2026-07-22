import type { Metadata } from "next";
import NavBar from "./components/NavBar";
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
      <body>
        <NavBar />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}

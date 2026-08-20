import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neuralix RAG — AI Document Q&A",
  description: "Upload documents, ask questions, get cited answers. Built by Neuralix Labs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

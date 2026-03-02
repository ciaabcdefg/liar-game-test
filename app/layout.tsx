import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guess the Liar | Multiplayer Party Game",
  description: "A multiplayer party game where one player gets a different question. Can you spot the imposter?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

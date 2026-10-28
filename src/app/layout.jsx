import "./globals.css";

export const metadata = {
  title: "SmashMate — Temukan Partner Badminton",
  description:
    "Temukan partner selevel, isi slot pertandingan, dan booking lapangan badminton dalam satu platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

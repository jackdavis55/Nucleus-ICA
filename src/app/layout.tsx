import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUCLEUS | Just Culture Assessment System",
  description: "A human-led framework for understanding individual actions, working conditions and organisational circumstances after an event.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

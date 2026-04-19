import type { Metadata } from "next";
import "../styles/global.css";

export const metadata: Metadata = {
  title: "ExpressThat Auth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}

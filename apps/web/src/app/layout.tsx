import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./global.css";

export const metadata: Metadata = {
  title: "ExpressThat Auth",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}

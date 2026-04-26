import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js No-SSR Example – ExpressThat Auth UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

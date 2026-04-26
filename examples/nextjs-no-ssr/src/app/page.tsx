"use client";

import { ExButton } from "@expressthat-auth/ui-react";

// Client Component — ExButton is mounted in the browser only, no server rendering.
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Next.js Example (client-side only, no SSR)</h1>
      <p>ExButton is a client-side web component from @expressthat-auth/ui-react.</p>
      <ExButton label="Click Me" variant="primary" onExClick={() => alert("clicked!")} />
    </main>
  );
}

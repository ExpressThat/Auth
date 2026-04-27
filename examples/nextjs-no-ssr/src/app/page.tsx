"use client";

import { ExTestButton } from "@expressthat-auth/ui-react";

// Client Component — ExTestButton is mounted in the browser only, no server rendering.
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Next.js Example (client-side only, no SSR)</h1>
      <p>ExTestButton is a client-side web component from @expressthat-auth/ui-react.</p>
      <ExTestButton label="Click Me" variant="primary" onExTestClick={() => alert("clicked!")} />
    </main>
  );
}

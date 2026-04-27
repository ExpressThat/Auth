import { ExTestButton } from "@expressthat-auth/ui-react";

export default function Index() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Remix Example (SSR via withSSR vite plugin)</h1>
      <p>ExTestButton is server-rendered by the Stencil SSR vite plugin.</p>
      <ExTestButton label="Click Me" variant="primary" />
    </main>
  );
}

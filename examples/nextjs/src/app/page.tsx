import { ExTestButton } from "@expressthat-auth/ui-react/next";

// Server Component — ExTestButton is rendered on the server via Stencil hydrate.
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Next.js Example (SSR via server components)</h1>
      <p>ExTestButton is server-rendered using @expressthat-auth/ui-react/next.</p>
      <ExTestButton label="Click Me" variant="primary" />
    </main>
  );
}

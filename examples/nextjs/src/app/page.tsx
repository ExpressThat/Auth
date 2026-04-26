import { ExButton } from "@expressthat-auth/ui-react/next";

// Server Component — ExButton is rendered on the server via Stencil hydrate.
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Next.js Example (SSR via server components)</h1>
      <p>ExButton is server-rendered using @expressthat-auth/ui-react/next.</p>
      <ExButton label="Click Me" variant="primary" />
    </main>
  );
}

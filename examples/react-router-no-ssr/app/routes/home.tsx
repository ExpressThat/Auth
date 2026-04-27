import { ExTestButton } from "@expressthat-auth/ui-react";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React Router v7 Example (SPA mode, no SSR)</h1>
      <p>ExTestButton is a client-side web component from @expressthat-auth/ui-react.</p>
      <ExTestButton label="Click Me" variant="primary" onExTestClick={() => alert("clicked!")} />
    </main>
  );
}

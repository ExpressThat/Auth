import { ExButton } from "@expressthat-auth/ui-react";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React Router v7 Example (SPA mode, no SSR)</h1>
      <p>ExButton is a client-side web component from @expressthat-auth/ui-react.</p>
      <ExButton label="Click Me" variant="primary" onExClick={() => alert("clicked!")} />
    </main>
  );
}

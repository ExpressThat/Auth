import { ExTestButton } from "@expressthat-auth/ui-react";

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React Example (Vite, no SSR)</h1>
      <p>Renders ExTestButton from @expressthat-auth/ui-react as a client-side web component.</p>
      <ExTestButton label="Click Me" variant="primary" onExTestClick={() => alert("clicked!")} />
    </main>
  );
}

import { ExButton } from "@expressthat-auth/ui-react";

export default function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React Example (Vite, no SSR)</h1>
      <p>Renders ExButton from @expressthat-auth/ui-react as a client-side web component.</p>
      <ExButton label="Click Me" variant="primary" onExClick={() => alert("clicked!")} />
    </main>
  );
}
